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

  // Pestaña activa: 'admin' o 'arbitro'
  const [activeTab, setActiveTab] = useState<'admin' | 'arbitro'>('admin');

  // Modal Promover
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteRole, setPromoteRole] = useState<'Administrador' | 'Arbitro'>('Administrador');
  const [isPromoting, setIsPromoting] = useState(false);

  // Modal Crear
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
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
    if (!newUser.nombre || !newUser.email || !newUser.contrasena) return;
    setIsCreating(true);
    setErrorMsg(null);
    try {
      const res: any = await adminApi.crearAdministrador(newUser);
      setSuccessMsg(res?.message || res?.mensaje || `Nuevo ${newUser.rol} creado con éxito.`);
      setIsCreateModalOpen(false);
      setNewUser({ nombre: '', email: '', contrasena: '', telefono: '', rol: activeTab === 'arbitro' ? 'Arbitro' : 'Administrador' });
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
    <div className="p-6 md:p-10 w-full max-w-7xl mx-auto flex flex-col gap-8 font-['Inter',sans-serif]">
      {/* Header Banner */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-3xl border shadow-xl"
        style={{ backgroundColor: '#1e281d', borderColor: '#445941' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-2xl flex items-center justify-center text-[#65c556] shadow-lg shrink-0 border"
            style={{ backgroundColor: 'rgba(101,197,86,0.15)', borderColor: '#65c556' }}
          >
            <IconCrown size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Gestión de Personal Oficial & Autoridades
              </h1>
              <span className="bg-[#65c556] text-[#293827] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Exclusivo Superadmin
              </span>
            </div>
            <p className="text-xs text-[#a0a0a0] mt-1 max-w-2xl leading-relaxed">
              Los árbitros y administradores no se registran en el portal público. Son dados de alta y asignados exclusivamente por la dirección del complejo deportivo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setPromoteRole(activeTab === 'arbitro' ? 'Arbitro' : 'Administrador');
              setIsPromoteModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#293827] hover:bg-[#344732] border border-[#5a7056] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow cursor-pointer"
          >
            <IconMail size={16} />
            <span>Habilitar por Email</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewUser((prev) => ({ ...prev, rol: activeTab === 'arbitro' ? 'Arbitro' : 'Administrador' }));
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#65c556] hover:bg-[#54b045] text-[#293827] px-4 py-2.5 rounded-xl text-xs font-black transition shadow-lg shadow-[rgba(101,197,86,0.25)] cursor-pointer"
          >
            <IconUserPlus size={16} />
            <span>+ Crear {activeTab === 'arbitro' ? 'Árbitro Oficial' : 'Administrador'}</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="bg-[#14532d]/80 border border-[#22c55e] p-4 rounded-2xl flex items-center gap-3 text-sm text-[#bbf7d0] animate-fadeIn">
          <IconCheck className="size-5 shrink-0 text-[#22c55e]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[#7f1d1d]/80 border border-[#ef4444] p-4 rounded-2xl flex items-center gap-3 text-sm text-[#fecaca] animate-fadeIn">
          <IconAlert className="size-5 shrink-0 text-[#ef4444]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#3b4d38] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition cursor-pointer border-b-2 ${
            activeTab === 'admin'
              ? 'border-[#65c556] text-[#65c556] bg-[#1e281d]'
              : 'border-transparent text-[#a0a0a0] hover:text-white hover:bg-[#1e281d]/50'
          }`}
        >
          <IconShield size={16} />
          <span>Administradores de Sede ({adminsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('arbitro')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition cursor-pointer border-b-2 ${
            activeTab === 'arbitro'
              ? 'border-yellow-400 text-yellow-400 bg-[#1e281d]'
              : 'border-transparent text-[#a0a0a0] hover:text-white hover:bg-[#1e281d]/50'
          }`}
        >
          <IconWhistle size={16} />
          <span>Árbitros Oficiales AFA/UB ({arbitrosList.length})</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1e281d] border border-[#5a7056] p-5 rounded-2xl flex items-center gap-4">
          <div className="size-11 rounded-xl bg-[#293827] flex items-center justify-center text-[#65c556] border border-[#5a7056]">
            <IconCrown size={22} />
          </div>
          <div>
            <p className="text-xs text-[#a0a0a0]">Superadministrador Titular</p>
            <p className="text-sm font-bold text-white">admin@complejoub.com</p>
          </div>
        </div>

        <div className="bg-[#1e281d] border border-[#5a7056] p-5 rounded-2xl flex items-center gap-4">
          <div className="size-11 rounded-xl bg-[#293827] flex items-center justify-center text-[#65c556] border border-[#5a7056]">
            {activeTab === 'admin' ? <IconShield size={22} /> : <IconWhistle size={22} className="text-yellow-400" />}
          </div>
          <div>
            <p className="text-xs text-[#a0a0a0]">
              {activeTab === 'admin' ? 'Administradores Activos' : 'Árbitros Oficiales Registrados'}
            </p>
            <p className="text-xl font-black text-white">
              {displayedList.length} Personal Activo
            </p>
          </div>
        </div>

        <div className="bg-[#1e281d] border border-[#5a7056] p-5 rounded-2xl flex items-center gap-4">
          <div className="size-11 rounded-xl bg-[#293827] flex items-center justify-center text-[#65c556] border border-[#5a7056]">
            <IconCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-[#a0a0a0]">Validación de Correo</p>
            <p className="text-sm font-bold text-[#65c556]">100% Cuentas Verificadas</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-[#5a7056] flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {activeTab === 'admin' ? (
              <>
                <IconShield size={18} className="text-[#65c556]" />
                Nómina de Cuentas Administrativas
              </>
            ) : (
              <>
                <IconWhistle size={18} className="text-yellow-400" />
                Cuerpo Arbitral Oficial AFA / Complejo UB
              </>
            )}
          </h2>
          <span className="text-xs text-[#a0a0a0]">
            Total: {displayedList.length} cuentas con credenciales
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#5a7056] bg-[#293827]/70 text-[#a0a0a0] uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3.5 px-6">Usuario / Nombre</th>
                <th className="py-3.5 px-6">Correo Electrónico</th>
                <th className="py-3.5 px-6">Rol Jerárquico</th>
                <th className="py-3.5 px-6">Teléfono</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5a7056]/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#a0a0a0]">
                    Cargando cuentas...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#a0a0a0]">
                    No se encontraron cuentas registradas en esta categoría.
                  </td>
                </tr>
              ) : (
                displayedList.map((user) => {
                  const isSuper = user.rol === 'Superadministrador';
                  const isArbitro = user.rol === 'Arbitro';
                  return (
                    <tr key={user.id} className="hover:bg-[#293827]/40 transition">
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${
                            isSuper
                              ? 'bg-[#65c556] text-[#293827]'
                              : isArbitro
                              ? 'bg-yellow-400 text-black'
                              : 'bg-[#3b4d38] text-white'
                          }`}
                        >
                          {isSuper ? 'SA' : isArbitro ? 'ARB' : 'AD'}
                        </div>
                        <div>
                          <span>{user.nombre}</span>
                          {isSuper && (
                            <span className="block text-[10px] text-[#65c556] font-normal">
                              Titular Máximo
                            </span>
                          )}
                          {isArbitro && (
                            <span className="block text-[10px] text-yellow-400 font-normal">
                              Planilla Digital
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#c0c0c0] font-mono">{user.email}</td>
                      <td className="py-4 px-6">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#65c556]/15 border border-[#65c556] text-[#65c556]">
                            <IconCrown size={12} />
                            Superadministrador
                          </span>
                        ) : isArbitro ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-yellow-400/15 border border-yellow-400 text-yellow-300">
                            <IconWhistle size={12} />
                            Árbitro Oficial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 border border-blue-400 text-blue-300">
                            <IconShield size={12} />
                            Administrador
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[#a0a0a0]">{user.telefono || '—'}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#65c556]">
                          <span className="size-1.5 rounded-full bg-[#65c556]" />
                          Activa
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isSuper ? (
                          <span className="text-[11px] text-[#a0a0a0] italic">
                            Inmutable
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={revokingId === user.id}
                            onClick={() => handleRevoke(user.id, user.nombre, user.rol)}
                            className="bg-red-500/15 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1e281d] border border-[#5a7056] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-[rgba(101,197,86,0.15)] text-[#65c556] flex items-center justify-center border border-[#65c556]">
                <IconMail size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Habilitar Rol por Email</h3>
                <p className="text-xs text-[#a0a0a0]">Promover un usuario registrado a personal oficial</p>
              </div>
            </div>

            <form onSubmit={handlePromote} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c0c0c0]">Rol a Asignar</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPromoteRole('Administrador')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      promoteRole === 'Administrador'
                        ? 'bg-[#65c556] text-[#293827] border-[#65c556]'
                        : 'bg-[#293827] text-[#a0a0a0] border-[#445941]'
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
                        ? 'bg-yellow-400 text-black border-yellow-400'
                        : 'bg-[#293827] text-[#a0a0a0] border-[#445941]'
                    }`}
                  >
                    <IconWhistle size={14} />
                    <span>Árbitro Oficial</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c0c0c0]">Correo Electrónico Registrado</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@ejemplo.com"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  className="bg-[#293827] border border-[#5a7056] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#65c556]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#a0a0a0] hover:text-white bg-[#293827] border border-[#5a7056] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPromoting || !promoteEmail.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#65c556] hover:bg-[#54b045] text-[#293827] shadow cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1e281d] border border-[#5a7056] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-[rgba(101,197,86,0.15)] text-[#65c556] flex items-center justify-center border border-[#65c556]">
                <IconUserPlus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Alta de Personal Oficial</h3>
                <p className="text-xs text-[#a0a0a0]">Generar credenciales para un nuevo miembro del complejo</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c0c0c0]">Rol a Crear</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, rol: 'Administrador' })}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      newUser.rol === 'Administrador'
                        ? 'bg-[#65c556] text-[#293827] border-[#65c556]'
                        : 'bg-[#293827] text-[#a0a0a0] border-[#445941]'
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
                        ? 'bg-yellow-400 text-black border-yellow-400'
                        : 'bg-[#293827] text-[#a0a0a0] border-[#445941]'
                    }`}
                  >
                    <IconWhistle size={14} />
                    <span>Árbitro Oficial</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c0c0c0]">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sebastián Norjean"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  className="bg-[#293827] border border-[#5a7056] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#65c556]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c0c0c0]">Correo Electrónico Oficial</label>
                <input
                  type="email"
                  required
                  placeholder="arbitro@complejoub.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-[#293827] border border-[#5a7056] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#65c556]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c0c0c0]">Contraseña Inicial</label>
                  <div className="flex items-center bg-[#293827] border border-[#5a7056] rounded-xl px-3.5 py-2 focus-within:border-[#65c556]">
                    <input
                      type={showNewUserPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={newUser.contrasena}
                      onChange={(e) => setNewUser({ ...newUser, contrasena: e.target.value })}
                      className="w-full bg-transparent text-sm text-white focus:outline-none border-none p-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword((prev) => !prev)}
                      className="text-[#a0a0a0] hover:text-[#65c556] transition cursor-pointer shrink-0 p-1 flex items-center justify-center ml-2"
                      title={showNewUserPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showNewUserPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c0c0c0]">Teléfono de Contacto (Opcional)</label>
                  <input
                    type="tel"
                    placeholder="+54 11 ..."
                    value={newUser.telefono}
                    onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                    className="bg-[#293827] border border-[#5a7056] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#65c556]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#a0a0a0] hover:text-white bg-[#293827] border border-[#5a7056] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#65c556] hover:bg-[#54b045] text-[#293827] shadow cursor-pointer disabled:opacity-50"
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
