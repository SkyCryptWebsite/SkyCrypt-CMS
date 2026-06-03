import type { CollectionBeforeValidateHook } from 'payload'

export const setAuthorOnCreate: CollectionBeforeValidateHook = ({ data, req, operation }) => {
  if (operation === 'create' && req.user && data && !data.author) {
    data.author = req.user.id
  }
  return data
}
