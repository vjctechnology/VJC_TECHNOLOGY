// VJC Technology — app.js
// Cliente Supabase compartido + auth guard + utilidades comunes a todas las páginas.
// Requiere que cada página cargue antes el SDK:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = 'https://oxtggipvbgkblygynpkn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94dGdnaXB2YmdrYmx5Z3lucGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MDM0NDUsImV4cCI6MjEwMTM3OTQ0NX0.P-O1en1Gv2hBq-JWftmq8OJXhrcAfjvNhHa_xi9YmAU';
const LOGIN_URL = 'https://vjc-fixed-8oca.vercel.app/vjc-tecnology-de_veritas/vjc_login.html';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sb = sb;

// Promesa que cada página espera antes de cargar datos. Redirige a login si no hay sesión.
window.vjcAuthReady = (async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = LOGIN_URL;
    return null;
  }
  return session;
})();

// Si la sesión se cierra (en esta pestaña u otra sincronizada), saca del dashboard.
sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.href = LOGIN_URL;
});

async function vjcLogout() {
  await sb.auth.signOut();
  window.location.href = LOGIN_URL;
}
window.vjcLogout = vjcLogout;

// Escapa HTML antes de inyectar datos (de la BD o del usuario) en innerHTML.
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
window.esc = esc;

function formatDate(d) {
  if (!d) return '-';
  const [y, m, day] = String(d).split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}
window.formatDate = formatDate;

function showToast(msg, isError) {
  let box = document.getElementById('vjc-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'vjc-toast';
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.className = 'vjc-toast open' + (isError ? ' error' : '');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => box.classList.remove('open'), 3500);
}
window.showToast = showToast;

// Muestra un error de Supabase de forma legible (ej. bloqueo por RLS) y lo deja en consola.
function supaError(error, contexto) {
  console.error(contexto || '', error);
  showToast((contexto ? contexto + ': ' : '') + (error?.message || 'No tienes permiso para hacer esto.'), true);
}
window.supaError = supaError;

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  loadCurrentProfile();
});

// Rellena el nombre/rol/avatar del sidebar con el perfil real del usuario autenticado.
async function loadCurrentProfile() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const nameEl = document.querySelector('.user-name');
  const roleEl = document.querySelector('.user-role');
  const avatarEl = document.querySelector('.user-avatar');
  const { data: profile } = await sb.from('profiles').select('nombre,rol').eq('id', user.id).maybeSingle();
  const nombre = profile?.nombre || user.email || 'Usuario';
  const rolLabel = { admin: 'Administrador', tecnico: 'Técnico', ventas: 'Ventas' }[profile?.rol] || '';
  if (nameEl) nameEl.textContent = nombre;
  if (roleEl) roleEl.textContent = rolLabel;
  if (avatarEl) avatarEl.textContent = nombre.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
window.loadCurrentProfile = loadCurrentProfile;
