import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/endpoints';
import {
  IconShield,
  IconCrown,
  IconUserPlus,
  IconMail,
  IconCheck,
  IconAlert,
  IconWhistle,
  IconEye,
  IconEyeOff
} from '../components/Icons';

export const AdminGestionUsuarios: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'admin' | 'arbitro'>('admin');

  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteRole, setPromoteRole] = useState<'Administrador' | 'Arbitro'>('Administrador');
  const [isPromoting, setIsPromoting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    dni: '',
    contrasena: '',
    telefono: '',
    rol: 'Administrador' as 'Administrador' | 'Arbitro'
  });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [revokingId, setRevokingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res: any = await adminApi.getAdministradores();
      if (res?.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (Array.isArray(res)) {
        setUsers(res);
      }
    } catch (err: any) {
      console.warn('[AdminGestionUsuarios] Error al cargar usuarios:', err?.message);
      setErrorMsg(err?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteEmail.trim()) return;
    setIsPromoting(true);
    setErrorMsg(null);
    try {
      const res: any = await adminApi.promoverUsuario(promoteEmail.trim(), promoteRole);
      setSuccessMsg(res?.message || res?.mensaje || `Usuario promovido a ${promoteRole} con éxito.`);
      setIsPromoteModalOpen(false);
      setPromoteEmail('');
      await fetchUsers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al promover usuario.');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDni = newUser.dni.replace(/\D/g, '').trim();

    if (!newUser.nombre.trim() || !newUser.email.trim() || !newUser.contrasena.trim()) {
      setErrorMsg('Nombre, email y contraseña son obligatorios.');
      return;
    }

    if (!cleanDni) {
      setErrorMsg('El DNI es obligatorio para dar de alta autoridades y personal oficial.');
      return;
    }

    if (cleanDni.length < 7 || cleanDni.length > 8) {
      setErrorMsg('El DNI debe contener exactamente 7 u 8 dígitos numéricos.');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);
    try {
      const res: any = await adminApi.crearAdministrador({
        ...newUser,
        dni: cleanDni
      });
      setSuccessMsg(res?.message || res?.mensaje || `Nuevo ${newUser.rol} creado con éxito.`);
      setIsCreateModalOpen(false);
      setNewUser({ nombre: '', email: '', dni: '', contrasena: '', telefono: '', rol: activeTab === 'arbitro' ? 'Arbitro' : 'Administrador' });
      await fetchUsers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al crear usuario.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: number, nombre: string, rol: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas revocar los permisos de ${rol} a ${nombre}? Pasará a tener rol Cliente regular.`)) {
      return;
    }
    setRevokingId(id);
    setErrorMsg(null);
    try {
      const res: any = await adminApi.revocarAdministrador(id);
      setSuccessMsg(res?.mensaje || 'Permisos revocados con éxito.');
      await fetchUsers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al revocar permisos.');
    } finally {
      setRevokingId(null);
    }
  };

  const adminsList = users.filter((u) => u.rol === 'Administrador' || u.rol === 'Superadministrador');
  const arbitrosList = users.filter((u) => u.rol === 'Arbitro');
  const displayedList = activeTab === 'admin' ? adminsList : arbitrosList;

  return (
    <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-6 bg-slate-50 min-h-full text-slate-900 font-['Inter',sans-serif]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <IconCrown size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestión de Personal Oficial y Autoridades
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Exclusivo Superadmin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Los árbitros y administradores no se registran en el portal público. Son dados de alta y asignados exclusivamente por la dirección del complejo deportivo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setPromoteRole(activeTab === 'arbitro' ? 'Arbitro' : 'Administrador');
              setIsPromoteModalOpen(true);
            }}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <IconMail size={15} />
            <span>Habilitar por Email</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewUser((prev) => ({ ...prev, rol: activeTab === 'arbitro' ? 'Arbitro' : 'Administrador' }));
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border-none"
          >
            <IconUserPlus size={15} />
            <span>+ Crear {activeTab === 'arbitro' ? 'Árbitro Oficial' : 'Administrador'}</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-medium">
          <IconCheck className="size-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-xs text-red-700 font-medium">
          <IconAlert className="size-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <IconShield size={15} />
          <span>Administradores de Sede ({adminsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('arbitro')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'arbitro'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <IconWhistle size={15} />
          <span>Árbitros Oficiales AFA/UB ({arbitrosList.length})</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="size-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200">
            <IconCrown size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Superadministrador Titular</p>
            <p className="text-sm font-bold text-slate-900">admin@complejoub.com</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="size-11 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-700 border border-slate-200">
            {activeTab === 'admin' ? <IconShield size={20} /> : <IconWhistle size={20} className="text-amber-500" />}
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {activeTab === 'admin' ? 'Administradores Activos' : 'Árbitros Oficiales Registrados'}
            </p>
            <p className="text-lg font-black text-slate-900">
              {displayedList.length} Personal Activo
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="size-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200">
            <IconCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Validación de Correo</p>
            <p className="text-sm font-bold text-emerald-700">100% Cuentas Verificadas</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            {activeTab === 'admin' ? (
              <>
                <IconShield size={16} className="text-emerald-600" />
                Nómina de Cuentas Administrativas
              </>
            ) : (
              <>
                <IconWhistle size={16} className="text-amber-500" />
                Cuerpo Arbitral Oficial AFA / Complejo UB
              </>
            )}
          </h2>
          <span className="text-xs text-slate-500">
            Total: {displayedList.length} cuentas con credenciales
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3.5 px-6">Usuario / Nombre</th>
                <th className="py-3.5 px-6">Correo Electrónico</th>
                <th className="py-3.5 px-6">Rol Jerárquico</th>
                <th className="py-3.5 px-6">Teléfono</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Cargando cuentas...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron cuentas registradas en esta categoría.
                  </td>
                </tr>
              ) : (
                displayedList.map((user) => {
                  const isSuper = user.rol === 'Superadministrador';
                  const isArbitro = user.rol === 'Arbitro';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${
                            isSuper
                              ? 'bg-emerald-600 text-white'
                              : isArbitro
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSuper ? 'SA' : isArbitro ? 'ARB' : 'AD'}
                        </div>
                        <div>
                          <span>{user.nombre}</span>
                          {isSuper && (
                            <span className="block text-[10px] text-emerald-700 font-normal">
                              Titular Máximo
                            </span>
                          )}
                          {isArbitro && (
                            <span className="block text-[10px] text-amber-600 font-normal">
                              Planilla Digital
                            </span>
                          )}
                          {user.dni && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              DNI: {user.dni}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono">{user.email}</td>
                      <td className="py-4 px-6">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <IconCrown size={12} />
                            Superadministrador
                          </span>
                        ) : isArbitro ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                            <IconWhistle size={12} />
                            Árbitro Oficial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
                            <IconShield size={12} />
                            Administrador
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500">{user.telefono || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          Activa
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isSuper ? (
                          <span className="text-[11px] text-slate-400 italic">
                            Inmutable
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={revokingId === user.id}
                            onClick={() => handleRevoke(user.id, user.nombre, user.rol)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                          >
                            {revokingId === user.id ? 'Revocando...' : 'Revocar a Cliente'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Promover Usuario Existente por Email */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <IconMail size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Habilitar Rol por Email</h3>
                <p className="text-xs text-slate-500">Promover un usuario registrado a personal oficial</p>
              </div>
            </div>

            <form onSubmit={handlePromote} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Rol a Asignar</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPromoteRole('Administrador')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      promoteRole === 'Administrador'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <IconShield size={14} />
                    <span>Administrador</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoteRole('Arbitro')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      promoteRole === 'Arbitro'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <IconWhistle size={14} />
                    <span>Árbitro Oficial</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Correo Electrónico Registrado</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@ejemplo.com"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPromoting || !promoteEmail.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50 border-none"
                >
                  {isPromoting ? 'Promoviendo...' : `Habilitar como ${promoteRole}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Personal Oficial */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <IconUserPlus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Alta de Personal Oficial</h3>
                <p className="text-xs text-slate-500">Generar credenciales para un nuevo miembro del complejo</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Rol a Crear</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, rol: 'Administrador' })}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      newUser.rol === 'Administrador'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <IconShield size={14} />
                    <span>Administrador</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, rol: 'Arbitro' })}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      newUser.rol === 'Arbitro'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <IconWhistle size={14} />
                    <span>Árbitro Oficial</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sebastián Norjean"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">DNI / Documento de Identidad (7 u 8 dígitos)</label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="Ej: 38456123"
                  value={newUser.dni}
                  onChange={(e) => setNewUser({ ...newUser, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Correo Electrónico Oficial</label>
                <input
                  type="email"
                  required
                  placeholder="arbitro@complejoub.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Contraseña Inicial</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-emerald-600 focus-within:bg-white">
                    <input
                      type={showNewUserPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={newUser.contrasena}
                      onChange={(e) => setNewUser({ ...newUser, contrasena: e.target.value })}
                      className="w-full bg-transparent text-sm text-slate-900 focus:outline-none border-none p-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword((prev) => !prev)}
                      className="text-slate-400 hover:text-emerald-600 transition cursor-pointer shrink-0 p-1 flex items-center justify-center ml-2"
                      title={showNewUserPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showNewUserPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Teléfono de Contacto (Opcional)</label>
                  <input
                    type="tel"
                    placeholder="+54 11 ..."
                    value={newUser.telefono}
                    onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50 border-none"
                >
                  {isCreating ? 'Guardando...' : `Crear ${newUser.rol}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGestionUsuarios;
