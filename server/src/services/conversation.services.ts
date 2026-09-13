import { db } from "../prisma/db.js";

interface Conversation {
  id: number;
  createdAt: string;
  last_message_at: string | null;
}

export default class ConversationService {

  // Create a new conversation
  async createConversation(
    memberIds: number[]
  ): Promise<Conversation> {
    
    const conversation = await db.orm.public.Direct_conversation.create({});

    for(const userId of memberIds) {
      await this.addMember(conversation.id, userId);
    }

    return conversation;
  }

//   // Find an existing 1-to-1 conversation
  async findOrCreateDirectConversation(
    userId1: number,
    userId2: number
  ): Promise<Conversation | null> {
    const existence = await db.orm.public.Direct_conversation
      .where((conversation) => conversation.direct_conversation_member.some((member) => member.user_id.eq(userId1)))
      .where((conversation) => conversation.direct_conversation_member.some((member) => member.user_id.eq(userId2)))
      .include('direct_conversation_member')
      .first();
    
    if(existence) {
      return existence;
    }

    return await this.createConversation([userId1, userId2]);
  }

//   // Get a conversation by ID
  async getConversation(
    conversationId: number
  ){
        const [conversation] = await db.orm.public.Direct_conversation.where({id: conversationId}).all();

        if(!conversation) {
            throw new Error("Conversation not found ");
        }

        return conversation;
  }

//   // Check whether a user belongs to a conversation
  async isMember(
    conversationId: number,
    userId: number
  ): Promise<boolean> {
        const conversation = await this.getConversation(conversationId);

        const [member] = await db.orm.public.Direct_conversation_member.where({
            conversation_id: conversationId, 
            user_id: userId
        }).all();

        return member ? true : false;
  }

//   // Get all members of a conversation
  async getMembers(
    conversationId: number
  ): Promise<{conversation_id: number, user_id: number}[]> {
        const conversation = await this.getConversation(conversationId);

        const conversationMembers = await db.orm.public.Direct_conversation_member.where({conversation_id: conversation.id}).all();

        return conversationMembers.map((v) => {return {conversation_id: v.conversation_id, user_id: v.user_id}});
  }

//   // Get only user IDs
  async getMemberIds(
    conversationId: number
  ): Promise<number[]> {
    const members = await this.getMembers(conversationId);

    return members.map((mem) => mem.user_id);
  }

  // Add a member
  async addMember(
    conversationId: number,
    userId: number
  ): Promise<void> {

    const isConversationExist = await this.getConversation(conversationId);

    if(!isConversationExist) {
      throw new Error("Invalid conversation id");
    }
    await db.orm.public.Direct_conversation_member.create({
        conversation_id: conversationId,
        user_id: userId,
      })
  }

//   // Remove a member
}

export const conversationService = new ConversationService();