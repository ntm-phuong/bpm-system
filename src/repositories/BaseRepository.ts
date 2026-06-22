// src/repositories/BaseRepository.ts

import { SPFI } from '@pnp/sp';
import { getSP } from '../config/pnpConfig';
import { IPerson } from '../models';

export abstract class BaseRepository {

  protected get sp(): SPFI {
    return getSP();
  }

  protected now(): string {
    return new Date().toISOString();
  }

  protected mapPerson(
    raw: Record<string, unknown>,
    field: string
  ): IPerson | undefined {
    const person = raw[field] as
      | { Id?: number; Title?: string; EMail?: string; Name?: string }
      | undefined;

    if (!person?.Id) return undefined;

    return {
      Id: person.Id,
      Title: person.Title ?? '',
      EMail: person.EMail ?? '',
      Name: person.Name,
    };
  }

  protected mapLookupId(
    raw: Record<string, unknown>,
    field: string
  ): number | undefined {
    return (raw[`${field}Id`] as number) ?? undefined;
  }

  protected generateTitle(prefix: string, suffix?: number | string): string {
    const d = new Date();
    const pad = (n: number): string => n.toString().padStart(2, '0');
    const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const tail = suffix ?? Date.now().toString().slice(-4);
    return `${prefix}-${date}-${tail}`;
  }

  // FIX TS2339: constructor.name không khả dụng trong SPFx strict mode
  // Dùng className string thay vì this.constructor.name
  protected handleError(error: unknown, method: string): never {
    const className = Object.getPrototypeOf(this).constructor.name as string | undefined;
    const ctx = `${className ?? 'Repository'}.${method}`;
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[BPM][${ctx}]`, error);
    throw new Error(`[${ctx}] ${msg}`);
  }
}