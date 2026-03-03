import { Imovel, UserRole } from '@prisma/client';
import { ForbiddenError } from '../../utils/app-error';

type AuthenticatedUser = {
  id: string;
  role: string;
};

export function canEditImovel(user: AuthenticatedUser, imovel: Imovel): boolean {
  return user.role === UserRole.ADMIN || user.id === imovel.corretorCaptadorId;
}

export function assertCanEditImovel(user: AuthenticatedUser, imovel: Imovel): void {
  if (!canEditImovel(user, imovel)) {
    throw new ForbiddenError('Você não tem permissão para editar este imóvel');
  }
}

export function resolveUpdatedCorretorCaptadorId(
  requestedCorretorCaptadorId: string | undefined,
  user: AuthenticatedUser,
  imovel: Imovel,
): string {
  if (requestedCorretorCaptadorId === undefined) {
    return imovel.corretorCaptadorId;
  }

  if (user.role === UserRole.ADMIN) {
    return requestedCorretorCaptadorId;
  }

  if (requestedCorretorCaptadorId !== imovel.corretorCaptadorId) {
    throw new ForbiddenError('Somente ADMIN pode alterar o corretor captador');
  }

  return imovel.corretorCaptadorId;
}
