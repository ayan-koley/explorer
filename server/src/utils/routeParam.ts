import type { Request } from 'express';

export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

export function routeIntParam(req: Request, name: string): number {
  return Number(routeParam(req, name));
}
