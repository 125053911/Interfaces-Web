// db.js - Modelo de datos según weirdo_comics_bd (localStorage), sesión y utilidades
const DB = (() => {
  const VERSION = 'v4';
  const IVA = 0.16;           // Supuesto: tasa de impuesto del ticket (ajustable)
  const DESC_VOLUMEN = 0.10;  // RN-WEB-008
  const MIN_VOLUMEN = 5;      // RN-WEB-008

  // Tablas: clave de almacenamiento y llave primaria (según el diccionario de datos)
  const TABLAS = {
    rol:                   { clave: 'weirdo_rol',             pk: 'id_rol' },
    usuario:               { clave: 'weirdo_usuario',         pk: 'id_usuario' },
    categoria:             { clave: 'weirdo_categoria',       pk: 'id_categoria' },
    producto:              { clave: 'weirdo_producto',        pk: 'id_producto' },
    proveedor:             { clave: 'weirdo_proveedor',       pk: 'id_proveedor' },
    pedido:                { clave: 'weirdo_pedido',          pk: 'id_pedido' },
    detalle_pedido:        { clave: 'weirdo_detalle_pedido',  pk: 'id_detalle_pedido' },
    venta:                 { clave: 'weirdo_venta',           pk: 'id_venta' },
    detalle_venta:         { clave: 'weirdo_detalle_venta',   pk: 'id_detalle' },
    movimiento_inventario: { clave: 'weirdo_movimiento',      pk: 'id_movimiento' }
  };

  const fechaDe = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const fechaHoy = () => fechaDe(new Date());
  const ahora = () => { const d = new Date(); return fechaDe(d) + ' ' + d.toTimeString().slice(0, 5); };
  const r2 = n => Math.round(n * 100) / 100;
  const hoyTxt = fechaHoy();

  // SHA-256 de "12345678" (contraseña de demostración)
  const H = 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f';

  // Datos de ejemplo (se cargan la primera vez o con "Restaurar datos")
  const SEED = {
    rol: [
      { id_rol: 1, nombre: 'Administrador' },
      { id_rol: 2, nombre: 'Cajero' },
      { id_rol: 3, nombre: 'Encargado de Almacén' }
    ],
    usuario: [
      { id_usuario: 1, id_rol: 1, nombre: 'Ivan Isay Guerra López', correo: 'ivan@weirdo.com', telefono: '5550101', contrasena: H, requiere_cambio_clave: false, estado: true, ultimo_acceso: '2024-10-04 09:30' },
      { id_usuario: 2, id_rol: 2, nombre: 'Juan Pérez García', correo: 'juan@weirdo.com', telefono: '5550102', contrasena: H, requiere_cambio_clave: false, estado: true, ultimo_acceso: '2024-10-04 08:45' },
      { id_usuario: 3, id_rol: 3, nombre: 'María López Rodríguez', correo: 'maria@weirdo.com', telefono: '5550103', contrasena: H, requiere_cambio_clave: false, estado: true, ultimo_acceso: '2024-10-02 14:20' },
      { id_usuario: 4, id_rol: 2, nombre: 'Carlos Ruiz Sánchez', correo: 'carlos@weirdo.com', telefono: '5550104', contrasena: H, requiere_cambio_clave: false, estado: false, ultimo_acceso: '2024-10-02 11:05' }
    ],
    categoria: [
      { id_categoria: 1, nombre: 'Manga', tipo: 'Cómic' },
      { id_categoria: 2, nombre: 'Superhéroes', tipo: 'Cómic' },
      { id_categoria: 3, nombre: 'Figuras', tipo: 'Artículo' },
      { id_categoria: 4, nombre: 'Accesorios', tipo: 'Artículo' }
    ],
    producto: [
      { id_producto: 1, id_categoria: 2, isbn_codigo: '9780000000001', titulo: 'The Amazing Spider-Man', autor_marca: 'Stan Lee', costo: 8, precio: 12.99, stock: 45, stock_minimo: 20, stock_maximo: 100, estado: true },
      { id_producto: 2, id_categoria: 3, isbn_codigo: '9780000000002', titulo: 'Batman Figura', autor_marca: 'DC Comics', costo: 15, precio: 25.5, stock: 5, stock_minimo: 10, stock_maximo: 50, estado: true },
      { id_producto: 3, id_categoria: 2, isbn_codigo: '9780000000003', titulo: 'Fantastic Four', autor_marca: 'Jack Kirby', costo: 5, precio: 9.99, stock: 28, stock_minimo: 15, stock_maximo: 80, estado: true },
      { id_producto: 4, id_categoria: 3, isbn_codigo: '9780000000004', titulo: 'Superman Poder', autor_marca: 'DC Comics', costo: 12, precio: 19.9, stock: 22, stock_minimo: 8, stock_maximo: 30, estado: true }
    ],
    proveedor: [
      { id_proveedor: 1, empresa: 'Marvel Comics Distributor', rfc: 'MCD123456AB1', contacto: 'Laura Gómez', telefono: '5551234567', email: 'contacto@marveldist.com', terminos: '30 días de crédito', estado: true },
      { id_proveedor: 2, empresa: 'DC Comics Latinoamérica', rfc: 'DCL654321CD2', contacto: 'Ricardo Soto', telefono: '5559876543', email: 'ventas@dclatam.com', terminos: 'Pago contra entrega', estado: true },
      { id_proveedor: 3, empresa: 'Image Comics Import', rfc: 'ICI112233EF3', contacto: 'Ana Ruiz', telefono: '5554567890', email: 'pedidos@imageimport.mx', terminos: '', estado: false }
    ],
    pedido: [
      { id_pedido: 1, id_proveedor: 1, id_usuario: 1, fecha_solicitud: '2024-10-03 09:00', fecha_entrega_esperada: '2024-10-10', fecha_recepcion: null, estado: 'Enviado' },
      { id_pedido: 2, id_proveedor: 2, id_usuario: 1, fecha_solicitud: '2024-10-02 10:00', fecha_entrega_esperada: '2024-10-08', fecha_recepcion: '2024-10-08 12:00', estado: 'Recibido' },
      { id_pedido: 3, id_proveedor: 1, id_usuario: 1, fecha_solicitud: '2024-10-04 08:30', fecha_entrega_esperada: '2024-10-15', fecha_recepcion: null, estado: 'Creado' }
    ],
    detalle_pedido: [
      { id_detalle_pedido: 1, id_pedido: 1, id_producto: 1, cantidad: 100, costo_unitario: 8 },
      { id_detalle_pedido: 2, id_pedido: 2, id_producto: 4, cantidad: 20, costo_unitario: 12 },
      { id_detalle_pedido: 3, id_pedido: 3, id_producto: 3, cantidad: 50, costo_unitario: 5 }
    ],
    venta: [
      { id_venta: 1, id_usuario: 2, folio: 'T-000001', fecha: hoyTxt + ' 10:15', subtotal: 51.48, descuento: 0, impuestos: 8.24, total: 59.72, forma_pago: 'Efectivo', monto_pagado: 60 },
      { id_venta: 2, id_usuario: 2, folio: 'T-000002', fecha: hoyTxt + ' 11:40', subtotal: 29.97, descuento: 0, impuestos: 4.80, total: 34.77, forma_pago: 'Tarjeta', monto_pagado: 34.77 }
    ],
    detalle_venta: [
      { id_detalle: 1, id_venta: 1, id_producto: 1, cantidad: 2, precio_unitario: 12.99 },
      { id_detalle: 2, id_venta: 1, id_producto: 2, cantidad: 1, precio_unitario: 25.5 },
      { id_detalle: 3, id_venta: 2, id_producto: 3, cantidad: 3, precio_unitario: 9.99 }
    ],
    movimiento_inventario: [
      { id_movimiento: 1, id_producto: 1, id_usuario: 1, tipo: 'Entrada', cantidad: 47, fecha: '2024-10-01 08:00', motivo: 'Apertura de inventario' },
      { id_movimiento: 2, id_producto: 2, id_usuario: 1, tipo: 'Entrada', cantidad: 6, fecha: '2024-09-28 08:00', motivo: 'Apertura de inventario' },
      { id_movimiento: 3, id_producto: 3, id_usuario: 1, tipo: 'Entrada', cantidad: 31, fecha: '2024-10-02 08:00', motivo: 'Apertura de inventario' },
      { id_movimiento: 4, id_producto: 4, id_usuario: 1, tipo: 'Entrada', cantidad: 2, fecha: '2024-09-30 08:00', motivo: 'Apertura de inventario' },
      { id_movimiento: 5, id_producto: 4, id_usuario: 1, tipo: 'Entrada', cantidad: 20, fecha: '2024-10-08 12:00', motivo: 'Recepción pedido 2' },
      { id_movimiento: 6, id_producto: 1, id_usuario: 2, tipo: 'Salida', cantidad: 2, fecha: hoyTxt + ' 10:15', motivo: 'Venta T-000001' },
      { id_movimiento: 7, id_producto: 2, id_usuario: 2, tipo: 'Salida', cantidad: 1, fecha: hoyTxt + ' 10:15', motivo: 'Venta T-000001' },
      { id_movimiento: 8, id_producto: 3, id_usuario: 2, tipo: 'Salida', cantidad: 3, fecha: hoyTxt + ' 11:40', motivo: 'Venta T-000002' }
    ]
  };

  function init() {
    if (localStorage.getItem('weirdo_version') === VERSION) return;
    Object.keys(TABLAS).forEach(t => localStorage.setItem(TABLAS[t].clave, JSON.stringify(SEED[t])));
    localStorage.setItem('weirdo_version', VERSION);
  }
  init();

  // ===== Acceso a tablas =====
  const all = t => JSON.parse(localStorage.getItem(TABLAS[t].clave) || '[]');
  const save = (t, filas) => localStorage.setItem(TABLAS[t].clave, JSON.stringify(filas));
  const same = (a, b) => String(a) === String(b);
  const get = (t, id) => all(t).find(r => same(r[TABLAS[t].pk], id));

  function add(t, fila) {
    const filas = all(t), pk = TABLAS[t].pk;
    fila[pk] = Math.max(0, ...filas.map(r => Number(r[pk]))) + 1;
    filas.push(fila);
    save(t, filas);
    return fila;
  }

  function update(t, id, cambios) {
    const pk = TABLAS[t].pk;
    save(t, all(t).map(r => (same(r[pk], id) ? { ...r, ...cambios } : r)));
  }

  // ===== Nombres de referencia =====
  const nombreRol = id => (get('rol', id) || {}).nombre || '—';
  const proveedorNombre = id => (get('proveedor', id) || {}).empresa || '—';
  const productoNombre = id => (get('producto', id) || {}).titulo || '—';
  const usuarioNombre = id => (get('usuario', id) || {}).nombre || '—';
  const tipoProducto = p => (get('categoria', p.id_categoria) || {}).tipo || '';

  // ===== Folio de venta: T-000001, T-000002... =====
  const folioSiguiente = () => 'T-' + String(Math.max(0, ...all('venta').map(v => v.id_venta)) + 1).padStart(6, '0');

  // ===== Validaciones =====
  const correoValido = c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
  const telefonoValido = t => /^\+?\d{7,15}$/.test(String(t).replace(/[\s()-]/g, ''));
  const rfcValido = r => /^[A-Za-z0-9]{12,13}$/.test(r);

  async function hashClave(texto) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // ===== Utilidades =====
  const money = n => '$' + Number(n || 0).toFixed(2);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // RN-WEB-011: agotado (0) o crítico (<= mínimo)
  function estadoStock(p) {
    if (p.stock === 0) return { texto: 'Agotado', clase: 'err' };
    if (p.stock <= p.stock_minimo) return { texto: 'Crítico', clase: 'warn' };
    return { texto: 'Normal', clase: '' };
  }

  // Importes de una venta (RN-WEB-008, RN-WEB-022)
  // lineas: [{ cantidad, precio, tipo }]
  function calcularVenta(lineas) {
    const subtotal = r2(lineas.reduce((a, l) => a + l.cantidad * l.precio, 0));
    const comics = lineas.filter(l => l.tipo === 'Cómic');
    const unidadesComics = comics.reduce((a, l) => a + l.cantidad, 0);
    const importeComics = comics.reduce((a, l) => a + l.cantidad * l.precio, 0);
    const descuento = unidadesComics >= MIN_VOLUMEN ? r2(importeComics * DESC_VOLUMEN) : 0;
    const impuestos = r2((subtotal - descuento) * IVA);
    return { subtotal, descuento, impuestos, total: r2(subtotal - descuento + impuestos) };
  }

  function descargar(nombre, filas) {
    const csv = filas.map(f => f.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = nombre;
    a.click();
  }

  // ===== Sesión y permisos (RN-WEB-020) =====
  const ACCESO = {
    'Administrador': ['*'],
    'Cajero': ['dashboard.html', 'ventas.html', 'inventario.html'],
    'Encargado de Almacén': ['dashboard.html', 'productos.html', 'inventario.html', 'pedidos.html']
  };
  const puede = (rol, pagina) => !!ACCESO[rol] && (ACCESO[rol].includes('*') || ACCESO[rol].includes(pagina));
  const sesion = () => JSON.parse(sessionStorage.getItem('weirdo_sesion') || 'null');

  function requerirSesion(pagina) {
    const s = sesion();
    if (!s) { location.replace('index.html'); throw new Error('redirect'); }
    if (!puede(s.rol, pagina)) {
      alert('Tu rol no tiene acceso a esta pantalla.');
      location.replace('dashboard.html');
      throw new Error('redirect');
    }
    // Si la cuenta se desactivó después de iniciar sesión, se cierra la sesión
    const u = get('usuario', s.id_usuario);
    if (!u || !u.estado) {
      sessionStorage.removeItem('weirdo_sesion');
      location.replace('index.html');
      throw new Error('redirect');
    }
    return s;
  }

  async function login(correo, clave) {
    const u = all('usuario').find(x => x.correo.toLowerCase() === correo.trim().toLowerCase());
    const hash = await hashClave(clave);
    if (!u || u.contrasena !== hash) return { error: 'Correo o contraseña incorrectos.' };
    if (!u.estado) return { error: 'Tu cuenta está inactiva. Contacta al administrador.' };
    return { usuario: u };
  }

  function iniciarSesion(u) {
    sessionStorage.setItem('weirdo_sesion', JSON.stringify({ id_usuario: u.id_usuario, nombre: u.nombre, rol: nombreRol(u.id_rol) }));
    update('usuario', u.id_usuario, { ultimo_acceso: ahora() });
  }

  // RN-WEB-004: cambio de contraseña temporal
  async function cambiarClave(id, nueva) {
    update('usuario', id, { contrasena: await hashClave(nueva), requiere_cambio_clave: false });
  }

  // ===== Barra superior y menú lateral =====
  const MENU = [
    ['dashboard.html', 'Dashboard'], ['productos.html', 'Productos'], ['inventario.html', 'Inventario'],
    ['proveedores.html', 'Proveedores'], ['pedidos.html', 'Pedidos'], ['ventas.html', 'Ventas'],
    ['reportes.html', 'Reportes'], ['usuarios.html', 'Usuarios']
  ];

  function layout(pagina, s) {
    document.getElementById('top').innerHTML = `
      <header class="topbar">
        <div class="marca">WEIRDO COMICS - Sistema de Gestión</div>
        <div class="sesion">Bienvenido, ${esc(s.nombre)} (${esc(s.rol)}) |
          <a href="#" id="btn-reset">Restaurar datos</a> |
          <a href="#" id="btn-salir">Cerrar Sesión</a></div>
      </header>`;
    document.getElementById('nav').innerHTML = `<ul class="menu">${MENU
      .filter(([h]) => puede(s.rol, h))
      .map(([h, t]) => `<li><a href="${h}" class="${h === pagina ? 'activo' : ''}">${t}</a></li>`).join('')}</ul>`;

    document.getElementById('btn-salir').onclick = e => {
      e.preventDefault();
      sessionStorage.removeItem('weirdo_sesion');
      location.href = 'index.html';
    };
    document.getElementById('btn-reset').onclick = e => {
      e.preventDefault();
      if (!confirm('¿Restaurar los datos de ejemplo? Se perderán los cambios.')) return;
      Object.values(TABLAS).forEach(t => localStorage.removeItem(t.clave));
      localStorage.removeItem('weirdo_version');
      init();
      sessionStorage.removeItem('weirdo_sesion');
      location.href = 'index.html';
    };
  }

  return {
    IVA, all, get, add, update, save, same,
    nombreRol, proveedorNombre, productoNombre, usuarioNombre, tipoProducto, folioSiguiente,
    correoValido, telefonoValido, rfcValido, hashClave,
    money, esc, estadoStock, calcularVenta, descargar,
    fechaHoy, fechaDe, ahora,
    login, iniciarSesion, cambiarClave, requerirSesion, sesion, puede, layout
  };
})();