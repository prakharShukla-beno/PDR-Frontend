import type { Contact, Prospect } from "@/types"

export function getContactAccountId(contact: Contact): string | null {
  if (typeof contact.accountId === "object" && contact.accountId !== null) {
    return (contact.accountId as Prospect)._id || null
  }
  if (typeof contact.accountId === "string" && contact.accountId) {
    return contact.accountId
  }
  return null
}

export function getContactAccountName(contact: Contact): string | null {
  if (typeof contact.accountId === "object" && contact.accountId !== null) {
    return (contact.accountId as Prospect).accountName || contact.accountName || null
  }
  return contact.accountName?.trim() || null
}
