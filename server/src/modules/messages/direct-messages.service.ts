import { db } from '../../prisma/db.js';

export class DirectMessageAccessError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

async function requireConversationMember(conversationId: number, userId: number) {
  const membership = await db.orm.public.ConversationMember.first({ conversationId, userId });
  if (!membership) throw new DirectMessageAccessError(404, 'Conversation not found');
  return membership;
}

export async function createConversation(userId: number, participantIds: number[]) {
  const userIds = [...new Set([userId, ...participantIds])];
  const users = await db.orm.public.User.select('id').where((user) => user.id.in(userIds)).all();
  if (users.length !== userIds.length) throw new DirectMessageAccessError(404, 'One or more participants were not found');

  return db.transaction(async (tx) => {
    const conversation = await tx.orm.public.Conversation.create({});
    for (const memberId of userIds) {
      await tx.orm.public.ConversationMember.create({ conversationId: conversation.id, userId: memberId });
    }
    return { ...conversation, members: userIds };
  });
}

export async function listConversations(userId: number) {
  const memberships = await db.orm.public.ConversationMember
    .where({ userId })
    .orderBy((membership) => membership.joinedAt.desc())
    .all();
  return Promise.all(memberships.map(async (membership) => {
    const conversation = await db.orm.public.Conversation.first({ id: membership.conversationId });
    const members = await db.orm.public.ConversationMember
      .where({ conversationId: membership.conversationId })
      .all();
    return conversation ? { ...conversation, members: members.map((member) => member.userId) } : null;
  })).then((conversations) => conversations.filter((conversation) => conversation !== null));
}

export async function listDirectMessages(
  conversationId: number,
  userId: number,
  options: { limit: number; before?: string },
) {
  await requireConversationMember(conversationId, userId);
  let query = db.orm.public.DirectMessage
    .where({ conversationId })
    .where((message) => message.deletedAt.isNull())
    .orderBy((message) => message.createdAt.desc());
  if (options.before) query = query.where((message) => message.createdAt.lt(options.before!));
  return (await query.limit(options.limit).all()).reverse();
}

export async function createDirectMessage(
  conversationId: number,
  userId: number,
  input: { content: string; replyToMessageId?: number },
) {
  await requireConversationMember(conversationId, userId);
  if (input.replyToMessageId !== undefined) {
    const parent = await db.orm.public.DirectMessage.first({ id: input.replyToMessageId });
    if (!parent || parent.conversationId !== conversationId || parent.deletedAt !== null) {
      throw new DirectMessageAccessError(400, 'Reply target must be an active message in this conversation');
    }
  }

  return db.transaction(async (tx) => {
    const message = await tx.orm.public.DirectMessage.create({
      conversationId,
      senderId: userId,
      content: input.content,
      replyToMessageId: input.replyToMessageId,
    });
    await tx.orm.public.Conversation.where({ id: conversationId }).update({ lastMessageAt: message.createdAt });
    const members = await tx.orm.public.ConversationMember.where({ conversationId }).all();
    for (const member of members) {
      if (member.userId !== userId) {
        await tx.orm.public.MessageReceipt.create({ messageId: message.id, userId: member.userId });
      }
    }
    return message;
  });
}

export async function updateDirectMessage(
  messageId: number,
  userId: number,
  content: string,
) {
  const message = await db.orm.public.DirectMessage.first({ id: messageId });
  if (!message) throw new DirectMessageAccessError(404, 'Message not found');
  await requireConversationMember(message.conversationId, userId);
  if (message.senderId !== userId) throw new DirectMessageAccessError(403, 'You can only edit your own messages');
  if (message.deletedAt !== null) throw new DirectMessageAccessError(409, 'Deleted messages cannot be edited');
  return db.orm.public.DirectMessage.where({ id: messageId }).update({ content, editedAt: new Date().toISOString() });
}

export async function deleteDirectMessage(messageId: number, userId: number) {
  const message = await db.orm.public.DirectMessage.first({ id: messageId });
  if (!message) throw new DirectMessageAccessError(404, 'Message not found');
  await requireConversationMember(message.conversationId, userId);
  if (message.senderId !== userId) throw new DirectMessageAccessError(403, 'You can only delete your own messages');
  if (message.deletedAt !== null) throw new DirectMessageAccessError(409, 'Message is already deleted');
  return db.orm.public.DirectMessage.where({ id: messageId }).update({ content: '', deletedAt: new Date().toISOString() });
}

export async function markConversationRead(conversationId: number, userId: number, messageId: number) {
  await requireConversationMember(conversationId, userId);
  const message = await db.orm.public.DirectMessage.first({ id: messageId });
  if (!message || message.conversationId !== conversationId) throw new DirectMessageAccessError(404, 'Message not found');
  const seenAt = new Date().toISOString();
  const receipt = await db.orm.public.MessageReceipt.first({ messageId, userId });
  if (receipt) {
    await db.orm.public.MessageReceipt.where({ messageId, userId }).update({ seenAt });
  } else if (message.senderId !== userId) {
    await db.orm.public.MessageReceipt.create({ messageId, userId, seenAt });
  }
  await db.orm.public.ConversationMember.where({ conversationId, userId }).update({ lastReadMessageId: messageId });
  return { conversationId, userId, messageId, seenAt };
}
