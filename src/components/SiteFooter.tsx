
import React from 'react';
import type { UserRole } from '../context/ComplejoContext';

type FooterScreen =
  | 'landing'
  | 'mis-reservas'
  | 'mis-torneos'
  | 'arbitro'
  | 'admin-agenda';

interface SiteFooterProps {
  userRole: UserRole;
  onNavigate: (screen: FooterScreen) => void;
}

const SiteFooter: React.FC<SiteFooterProps> = ({
  userRole,
  onNavigate
}) => {
  const isCliente = userRole === 'cliente';
  const isArbitro = userRole === 'arbitro';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  return (
    <footer className="ub-site-footer">
      <div className="ub-site-footer__container">

        <div className="ub-site-footer__main">
          <div className="ub-site-footer__info">
            <div className="ub-site-footer__brand">
              <img
                src="/logo-ub.png"
                alt=""
                className="ub-site-footer__logo"
              />

              <span>
                Complejo Deportivo <strong>UB</strong>
              </span>
            </div>

            <p className="ub-site-footer__description">
              Sistema Integral de Gestión Deportiva.
              Canchas, reservas y torneos en un solo lugar.
            </p>
          </div>

          <nav
            className="ub-site-footer__links"
            aria-label="Navegación del pie de página"
          >
            {(isCliente || isAdmin) && (
              <button
                type="button"
                onClick={() => onNavigate('landing')}
              >
                Canchas y Turnos
              </button>
            )}

            {isCliente && (
              <button
                type="button"
                onClick={() => onNavigate('mis-reservas')}
              >
                Mis Reservas
              </button>
            )}

            {(isCliente || isArbitro || isAdmin) && (
              <button
                type="button"
                onClick={() => onNavigate('mis-torneos')}
              >
                Torneos y Fixture
              </button>
            )}

            {isArbitro && (
              <button
                type="button"
                onClick={() => onNavigate('arbitro')}
              >
                Planilla Arbitral
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin-agenda')}
              >
                Administración
              </button>
            )}
          </nav>
        </div>

        <div className="ub-site-footer__bottom">
          <p>
            © {new Date().getFullYear()} Complejo Deportivo UB.
            Todos los derechos reservados.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default SiteFooter;
