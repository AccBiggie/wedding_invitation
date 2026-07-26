export function validateInvitation(body, { partial = false } = {}) {
  const errors = {};
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) errors.name = ['O nome dos convidados é obrigatório.'];
    else if (body.name.trim().length > 255) errors.name = ['O nome deve ter no máximo 255 caracteres.'];
  }
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 1000)) {
    errors.description = ['A descrição deve ter no máximo 1.000 caracteres.'];
  }
  return errors;
}
