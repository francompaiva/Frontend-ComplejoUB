import { apiClient } from './client';

export const authApi = {
  login: (email: string, contrasena: string) => apiClient.post('/auth/login', { email, contrasena }),
  register: (data: { nombre: string; email: string; contrasena: string; rol?: string; telefono?: string }) =>
    apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
};

export const canchasApi = {
  getAll: (deporte?: string) => apiClient.get('/canchas' + (deporte ? `?deporte=${encodeURIComponent(deporte)}` : '')),
  getById: (id: number) => apiClient.get(`/canchas/${id}`),
  getDisponibilidad: (id: number, fecha: string) => apiClient.get(`/canchas/${id}/disponibilidad?fecha=${fecha}`),
  create: (data: any) => apiClient.post('/canchas', data),
  update: (id: number, data: any) => apiClient.put(`/canchas/${id}`, data),
  delete: (id: number) => apiClient.delete(`/canchas/${id}`),
};

export const reservasApi = {
  getMisReservas: () => apiClient.get('/reservas/mis-reservas'),
  getAll: (fecha?: string) => apiClient.get('/reservas' + (fecha ? `?fecha=${fecha}` : '')),
  create: (data: { canchaId: number; fecha: string; hora: string }) => apiClient.post('/reservas', data),
  cancelar: (id: number, motivo?: string) => apiClient.post(`/reservas/${id}/cancelar`, { motivo }),
  registrarInasistencia: (id: number) => apiClient.put(`/reservas/${id}/inasistencia`),
};

export const torneosApi = {
  getAll: (estado?: string) => apiClient.get('/torneos' + (estado ? `?estado=${estado}` : '')),
  getById: (id: number) => apiClient.get(`/torneos/${id}`),
  getTablaPosiciones: (id: number) => apiClient.get(`/torneos/${id}/posiciones`),
  getFixture: (id: number) => apiClient.get(`/torneos/${id}/fixture`),
  create: (data: any) => apiClient.post('/torneos', data),
  generarFixture: (id: number, fechaInicio?: string) => apiClient.post(`/torneos/${id}/generar-fixture`, { fechaInicio }),
  delete: (id: number) => apiClient.delete(`/torneos/${id}`),
};

export const equiposApi = {
  getAll: (torneoId?: number) => apiClient.get('/equipos' + (torneoId ? `?torneoId=${torneoId}` : '')),
  getById: (id: number) => apiClient.get(`/equipos/${id}`),
  inscribir: (data: { torneoId: number; nombreEquipo: string }) => apiClient.post('/equipos', data),
  invitar: (equipoId: number, data: { emailUsuario: string; dorsal?: number }) =>
    apiClient.post(`/equipos/${equipoId}/invitar`, data),
  responderInvitacion: (equipoId: number, respuesta: 'ACEPTADA' | 'RECHAZADA') =>
    apiClient.put(`/equipos/${equipoId}/responder-invitacion`, { respuesta }),
};

export const partidosApi = {
  getAll: (torneoId?: number, arbitroId?: number, fecha?: string) => {
    const params = new URLSearchParams();
    if (torneoId) params.append('torneoId', String(torneoId));
    if (arbitroId) params.append('arbitroId', String(arbitroId));
    if (fecha) params.append('fecha', fecha);
    const qs = params.toString();
    return apiClient.get('/partidos' + (qs ? `?${qs}` : ''));
  },
  getMisPartidosArbitro: () => apiClient.get('/partidos/arbitro/mis-partidos'),
  registrarResultado: (id: number, data: { golesLocal: number; golesVisitante: number; observaciones?: string }) =>
    apiClient.put(`/partidos/${id}/resultado`, data),
  asignarArbitro: (id: number, arbitroId: number) => apiClient.put(`/partidos/${id}/asignar-arbitro`, { arbitroId }),
  cambiarEstado: (id: number, estado: string) => apiClient.put(`/partidos/${id}/estado`, { estado }),
};

export const listaEsperaApi = {
  unirse: (data: { canchaId: number; fecha: string; hora: string }) => apiClient.post('/lista-espera', data),
  getMisEspera: () => apiClient.get('/lista-espera/mis-esperas'),
  cancelar: (id: number) => apiClient.delete(`/lista-espera/${id}`),
};

export const notificacionesApi = {
  getMisNotificaciones: () => apiClient.get('/notificaciones'),
  marcarLeida: (id: number) => apiClient.put(`/notificaciones/${id}/leida`),
  marcarTodas: () => apiClient.put('/notificaciones/marcar-todas'),
};

export const reportesApi = {
  getDashboard: () => apiClient.get('/reportes/dashboard'),
  getAuditoria: (limite = 50) => apiClient.get(`/reportes/auditoria?limite=${limite}`),
};
