/* ============================================
   SIM-PTR BNPP — Frontend Application
   Supabase + Leaflet + Airbus Satellite
   ============================================ */
'use strict';

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */
const Toast = (() => {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  };
  const show = (type = 'info', title, message, duration = 4000) => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideIn 0.3s reverse'; setTimeout(() => toast.remove(), 300); }, duration);
  };
  return { show };
})();

/* ============================================
   API CLIENT — SUPABASE VERSION
   ============================================ */
const API = (() => {
  const isDemo = () => localStorage.getItem(CONFIG.DEMO_MODE_KEY) === 'true';

  const DEMO_DATA = {
    stats: { total: 156, normal: 80, need_action: 50, overdue: 26, with_cctv: 42 },
    ptr: [
      { id:'1', code:'PTR-001', epoch:'2025.0', latitude:1.240833, longitude:104.575556, region:'Kepri', district:'Bintan', location_desc:'Pulau Berakit', block_code:'Bintan Pesisir', condition_status:'normal', tilt_degree:0, has_cctv:false, koarmada:'Koarmada I', kodaeral:'Kodaeral IV (Batam)', perbatasan:'Malaysia', perairan:'Laut Natuna' },
      { id:'2', code:'PTR-001A', epoch:'2011.0', latitude:1.047778, longitude:104.830556, region:'Kepri', district:'Bintan', location_desc:'Pulau Sentut', block_code:'Bintan Pesisir', condition_status:'repair', tilt_degree:0, has_cctv:true, cctv_id:'CAM-JKT-001A', koarmada:'Koarmada I', kodaeral:'Kodaeral IV (Batam)', perbatasan:'Malaysia', perairan:'Laut Natuna' },
      { id:'3', code:'PTR-022', epoch:'2021.0', latitude:2.299944, longitude:105.596167, region:'Kepri', district:'Natuna', location_desc:'Pulau Tokongmalangbiru', block_code:'Siantan', condition_status:'repair', tilt_degree:0, has_cctv:true, cctv_id:'CAM-BDG-022', koarmada:'Koarmada I', kodaeral:'Kodaeral IV (Batam)', perbatasan:'Malaysia', perairan:'Laut Natuna' },
      { id:'4', code:'PTR-023', epoch:'2021.0', latitude:2.741389, longitude:105.379444, region:'Kepri', district:'Natuna', location_desc:'Pulau Damar', block_code:'Jemaja', condition_status:'relocate', tilt_degree:0, has_cctv:true, cctv_id:'CAM-SBY-023', koarmada:'Koarmada I', kodaeral:'Kodaeral IV (Batam)', perbatasan:'Malaysia', perairan:'Laut Natuna Utara' },
      { id:'5', code:'PTR-073', epoch:'2021.0', latitude:-7.2575, longitude:112.7521, region:'Surabaya', district:'Tanjung Perak', location_desc:'Kawasan Industri', block_code:'KI-3', condition_status:'relocate', tilt_degree:0, has_cctv:true, cctv_id:'CAM-SBY-073', koarmada:'Koarmada II', kodaeral:'Kodaeral V (Surabaya)', perbatasan:'Tidak Berbatasan', perairan:'Selat Madura' },
      { id:'6', code:'PTR-118', epoch:'2021.0', latitude:-5.1477, longitude:119.4327, region:'Makassar', district:'Ujung Pandang', location_desc:'Pesisir Losari', block_code:'LP-1', condition_status:'repair', tilt_degree:3.8, has_cctv:true, cctv_id:'CAM-MKS-118', koarmada:'Koarmada II', kodaeral:'Kodaeral VI (Makassar)', perbatasan:'Australia', perairan:'Laut Flores' }
    ],
    cctv: [
      { code:'PTR-001A', cctv_id:'CAM-JKT-001A', condition_status:'repair', region:'Kepri' },
      { code:'PTR-022', cctv_id:'CAM-BDG-022', condition_status:'repair', region:'Kepri' },
      { code:'PTR-023', cctv_id:'CAM-SBY-023', condition_status:'relocate', region:'Kepri' },
      { code:'PTR-073', cctv_id:'CAM-SBY-073', condition_status:'relocate', region:'Jawa Timur' },
      { code:'PTR-118', cctv_id:'CAM-MKS-118', condition_status:'repair', region:'Sulsel' }
    ]
  };

  return {
    async login(email, password) {
      if (isDemo()) return { token:'demo-token', user:{ id:'demo', username:'demo', fullName:'Demo User', role:'admin', region:'Jakarta' } };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
      const user = { id:data.user.id, username:profile?.username||data.user.email.split('@')[0], fullName:profile?.full_name||data.user.email, role:profile?.role||'viewer', region:profile?.region||'Unknown' };
      await supabase.from('users').update({ last_login:new Date().toISOString() }).eq('id', data.user.id);
      return { token:data.session.access_token, user };
    },

    async getStats(epoch = '2021.0') {
      if (isDemo()) return DEMO_DATA.stats;
      const { data, error } = await supabase.from('ptr').select('id,condition_status,last_inspection,has_cctv').eq('epoch', epoch);
      if (error) throw new Error(error.message);
      const total = data.length;
      const normal = data.filter(p => p.condition_status === 'normal').length;
      const need_action = data.filter(p => ['maintenance','repair','relocate'].includes(p.condition_status)).length;
      const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const overdue = data.filter(p => !p.last_inspection || new Date(p.last_inspection) < ninetyDaysAgo).length;
      const with_cctv = data.filter(p => p.has_cctv).length;
      return { total, normal, need_action, overdue, with_cctv };
    },

    async getPtrList(filters = {}) {
      if (isDemo()) return { data:DEMO_DATA.ptr, total:DEMO_DATA.ptr.length };
      let query = supabase.from('ptr').select('*').order('code', { ascending:true });
      if (filters.epoch) query = query.eq('epoch', filters.epoch);
      if (filters.condition) query = query.eq('condition_status', filters.condition);
      if (filters.region) query = query.ilike('region', `%${filters.region}%`);
      if (filters.search) query = query.or(`code.ilike.%${filters.search}%,location_desc.ilike.%${filters.search}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return { data:data||[], total:data?.length||0 };
    },

    async getCctvList() {
      if (isDemo()) return { data:DEMO_DATA.cctv };
      const { data, error } = await supabase.from('ptr').select('code,cctv_id,condition_status,region').eq('has_cctv', true).not('cctv_id','is',null).order('code');
      if (error) throw new Error(error.message);
      return { data:data||[] };
    },

    async createPtr(data) {
      if (isDemo()) {
        Toast.show('success','Demo Mode','Data disimpan ke localStorage');
        const drafts = JSON.parse(localStorage.getItem('simptr-drafts')||'[]');
        drafts.push({...data, id:'demo-'+Date.now(), created_at:new Date().toISOString()});
        localStorage.setItem('simptr-drafts', JSON.stringify(drafts));
        return data;
      }
      const { data:result, error } = await supabase.from('ptr').insert([{ code:data.code, epoch:data.epoch, latitude:data.latitude, longitude:data.longitude, region:data.region, condition_status:data.condition_status||'normal', tilt_degree:data.tilt_degree||0, notes:data.notes, created_by:localStorage.getItem('user-id') }]).select().single();
      if (error) throw new Error(error.message);
      await supabase.from('audit_log').insert([{ user_id:localStorage.getItem('user-id'), action:'CREATE', entity_type:'ptr', entity_id:result.id, new_values:data }]);
      return result;
    },

    async uploadPhotos(ptrId, files) {
      if (isDemo()) { Toast.show('info','Demo Mode',`${files.length} foto disimpan lokal`); return { photos:Array.from(files).map(f=>({file_name:f.name})) }; }
      const uploaded = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${ptrId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error } = await supabase.storage.from('ptr-photos').upload(fileName, file, { cacheControl:'3600', upsert:false });
        if (error) { console.error('Upload error:', error); continue; }
        const { data:{ publicUrl } } = supabase.storage.from('ptr-photos').getPublicUrl(fileName);
        const { data:photoRecord, error:dbError } = await supabase.from('photos').insert([{ ptr_id:ptrId, file_path:fileName, file_name:file.name, file_size:file.size, mime_type:file.type, public_url:publicUrl, uploaded_by:localStorage.getItem('user-id') }]).select().single();
        if (!dbError && photoRecord) uploaded.push({...photoRecord, public_url:publicUrl});
      }
      return { photos:uploaded };
    },

    async logout() {
      if (!isDemo()) await supabase.auth.signOut();
      localStorage.removeItem(CONFIG.TOKEN_KEY);
      localStorage.removeItem(CONFIG.USER_KEY);
      localStorage.removeItem('user-id');
    }
  };
})();

/* ============================================
   AUTH MODULE
   ============================================ */
const Auth = (() => {
  const loginScreen = document.getElementById('loginScreen');
  const mainApp = document.getElementById('mainApp');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const demoBtn = document.getElementById('demoBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const showApp = (user) => {
    loginScreen.classList.add('hidden');
    mainApp.style.display = 'grid';
    document.getElementById('userName').textContent = user.fullName || user.username;
    document.getElementById('userRole').textContent = `${user.role} · ${user.region||'—'}`;
    document.getElementById('userAvatar').textContent = (user.fullName||user.username).substring(0,2).toUpperCase();
    Dashboard.init();
  };

  const showLogin = () => { loginScreen.classList.remove('hidden'); mainApp.style.display = 'none'; };

  const init = async () => {
    const { data:{ session } } = await supabase.auth.getSession();
    if (session) {
      const { data:profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      const user = { id:session.user.id, username:profile?.username||session.user.email.split('@')[0], fullName:profile?.full_name||session.user.email, role:profile?.role||'viewer', region:profile?.region||'Unknown' };
      localStorage.setItem(CONFIG.TOKEN_KEY, session.access_token);
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
      localStorage.setItem('user-id', user.id);
      showApp(user);
    } else { showLogin(); }
  };

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('show');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Memproses...';
    try {
      const email = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;
      const data = await API.login(email, password);
      localStorage.setItem(CONFIG.TOKEN_KEY, data.token);
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('user-id', data.user.id);
      localStorage.removeItem(CONFIG.DEMO_MODE_KEY);
      Toast.show('success','Login berhasil',`Selamat datang, ${data.user.fullName}`);
      showApp(data.user);
    } catch (err) { loginError.textContent = err.message; loginError.classList.add('show'); }
    finally { loginBtn.disabled = false; loginBtn.textContent = 'Masuk'; }
  });

  demoBtn?.addEventListener('click', () => {
    localStorage.setItem(CONFIG.DEMO_MODE_KEY,'true');
    localStorage.setItem(CONFIG.TOKEN_KEY,'demo-token');
    const demoUser = { id:'demo', username:'demo', fullName:'Demo User', role:'admin', region:'Jakarta' };
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(demoUser));
    Toast.show('info','Mode Demo','Data contoh akan ditampilkan');
    showApp(demoUser);
  });

  logoutBtn?.addEventListener('click', async () => {
    if (confirm('Yakin ingin keluar?')) { await API.logout(); showLogin(); Toast.show('info','Logout berhasil','Sesi Anda telah diakhiri'); }
  });

  return { init };
})();

/* ============================================
   DASHBOARD MODULE
   ============================================ */
const Dashboard = (() => {
  let currentEpoch = '2021.0';
  let ptrData = [];
  let cctvData = [];
  let map = null;
  let markers = {};
  let selectedMarker = null;

  const init = async () => {
    await Promise.all([ loadStats(), loadPtrData(), loadCctvData() ]);
    initMap();
    renderCctvGrid();
  };

  const loadStats = async () => {
    try {
      const stats = await API.getStats(currentEpoch);
      document.getElementById('statTotal').textContent = Number(stats.total).toLocaleString('id-ID');
      document.getElementById('statNormal').textContent = Number(stats.normal).toLocaleString('id-ID');
      document.getElementById('statAction').textContent = Number(stats.need_action).toLocaleString('id-ID');
      document.getElementById('statOverdue').textContent = Number(stats.overdue).toLocaleString('id-ID');
      const pct = stats.total > 0 ? ((stats.normal/stats.total)*100).toFixed(1) : 0;
      document.getElementById('statNormalPct').textContent = `${pct}% dari total PTR`;
      document.getElementById('statTotalTrend').textContent = '↑ 4.2%';
    } catch (err) { Toast.show('error','Gagal memuat statistik',err.message); }
  };

  const loadPtrData = async () => {
    try {
      const result = await API.getPtrList({ epoch:currentEpoch });
      ptrData = result.data || [];
      document.getElementById('ptrCountBadge').textContent = ptrData.length;
      document.getElementById('mapActiveCount').textContent = ptrData.length;
    } catch (err) { Toast.show('error','Gagal memuat data PTR',err.message); }
  };

  const loadCctvData = async () => {
    try {
      const result = await API.getCctvList();
      cctvData = result.data || [];
      document.getElementById('mapCctvCount').textContent = cctvData.length;
    } catch (err) { Toast.show('error','Gagal memuat data CCTV',err.message); }
  };

  /* ============================================
     LEAFLET MAP WITH AIRBUS SATELLITE BASEMAP
     ============================================ */
  const initMap = () => {
    if (map) return;

    // Inisialisasi Leaflet
    map = L.map('map', {
      center: [-2.5, 118],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: true
    });

    // ============================================
    // AIRBUS ONEATLAS SATELLITE BASEMAP
    // ============================================
    // Opsi 1: Airbus OneAtlas (butuh API key - daftar gratis di https://oneatlas.airbus.com)
    // GANTI 'YOUR_AIRBUS_API_KEY' dengan API key Anda
    const airbusApiKey = 'YOUR_AIRBUS_API_KEY';  // ← DAFTAR GRATIS DI oneatlas.airbus.com
    
    L.tileLayer(`https://api.oneatlas.airbus.com/api/v1/tiles/wmts/1.0.0/SPOT_SATELLITE_IMAGERY/default/WebMercatorQuad/{z}/{y}/{x}.png?apikey=${airbusApiKey}`, {
      attribution: '&copy; <a href="https://oneatlas.airbus.com">Airbus DS</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: ['a','b','c','d'],
      maxZoom: 18
    }).addTo(map);

    // Opsi 2 (Fallback Gratis): Esri World Imagery (mirip kualitas Airbus)
    // Jika tidak punya API key Airbus, uncomment baris di bawah dan comment baris di atas:
    /*
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 18
    }).addTo(map);
    */

    // Overlay batas negara (opsional, gratis)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Render markers
    renderMarkers();

    // Filter Koarmada
    document.getElementById('filterKoarmada')?.addEventListener('change', (e) => {
      const selected = e.target.value;
      Object.values(markers).forEach(m => {
        if (!selected) m.marker.addTo(map);
        else {
          const ptr = ptrData.find(p => p.code === m.code);
          if (ptr && ptr.koarmada === selected) m.marker.addTo(map);
          else map.removeLayer(m.marker);
        }
      });
    });
  };

  const colorMap = { normal:'#15803d', maintenance:'#d97706', repair:'#b91c1c', relocate:'#7c2d12' };
  const statusLabel = { normal:'Normal', maintenance:'Perlu Pemeliharaan', repair:'Perlu Perbaikan', relocate:'Perlu Relokasi' };

  const renderMarkers = () => {
    ptrData.forEach(ptr => {
      const color = colorMap[ptr.condition_status] || '#15803d';
      
      // Custom marker icon
      const iconHtml = `
        <div style="position:relative; width:14px; height:14px;">
          <div style="width:14px; height:14px; border-radius:50%; background:${color}; border:2.5px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>`;
      
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([ptr.latitude, ptr.longitude], { icon: customIcon }).addTo(map);
      
      // Popup content
      const popupContent = `
        <div class="ptr-popup">
          <div class="ptr-popup-head">
            <div>
              <div class="ptr-popup-id">${ptr.code}</div>
              <div class="ptr-popup-name">${ptr.region} · ${ptr.block_code||ptr.location_desc||''}</div>
            </div>
          </div>
          <div class="ptr-popup-grid">
            <div><div class="ptr-popup-item-label">Kondisi</div><div class="ptr-popup-item-value">${statusLabel[ptr.condition_status]||ptr.condition_status}</div></div>
            <div><div class="ptr-popup-item-label">Kemiringan</div><div class="ptr-popup-item-value">${ptr.tilt_degree||0}°</div></div>
            <div><div class="ptr-popup-item-label">Latitude</div><div class="ptr-popup-item-value mono">${ptr.latitude}°</div></div>
            <div><div class="ptr-popup-item-label">Longitude</div><div class="ptr-popup-item-value mono">${ptr.longitude}°</div></div>
          </div>
          <div class="ptr-popup-koarmada">
            <div class="ptr-popup-koarmada-title">🏛️ Komando Wilayah</div>
            <div class="ptr-popup-koarmada-grid">
              <div><div class="ptr-popup-item-label">KOARMADA</div><div class="ptr-popup-koarmada-item">${ptr.koarmada||'-'}</div></div>
              <div><div class="ptr-popup-item-label">KODAERAL</div><div class="ptr-popup-koarmada-item">${ptr.kodaeral||'-'}</div></div>
            </div>
            <div style="margin-top:6px;"><div class="ptr-popup-item-label">PERAIRAN</div><div style="font-size:11px; font-weight:500;">${ptr.perairan||'-'}</div></div>
          </div>
          ${ptr.has_cctv ? `<div class="ptr-popup-cctv"><span class="ptr-popup-cctv-dot"></span><div><strong>CCTV tersedia</strong><br><span style="font-size:11px; color:#6b6a63;">Live streaming aktif</span></div></div>` : ''}
        </div>`;

      marker.bindPopup(popupContent, { maxWidth: 300, className: 'ptr-popup-wrapper' });
      
      marker.on('click', () => {
        // Highlight CCTV tile
        document.querySelectorAll('.cctv-tile').forEach(t => t.classList.remove('selected','dimmed'));
        if (ptr.has_cctv) {
          const tile = document.querySelector(`.cctv-tile[data-ptr="${ptr.code}"]`);
          if (tile) {
            tile.classList.add('selected');
            tile.scrollIntoView({ behavior:'smooth', block:'nearest' });
          }
        }
        document.querySelectorAll('.cctv-tile').forEach(t => {
          if (!t.classList.contains('selected')) t.classList.add('dimmed');
        });
        
        const sel = document.getElementById('cctvSelection');
        if (sel) { sel.style.display='inline-block'; sel.textContent=`Fokus: ${ptr.code}`; }
      });

      markers[ptr.code] = { marker, code:ptr.code, color };
    });
  };

  const renderCctvGrid = () => {
    const grid = document.getElementById('cctvGrid');
    grid.innerHTML = '';
    cctvData.forEach(cctv => {
      const tile = document.createElement('div');
      tile.className = 'cctv-tile';
      tile.dataset.ptr = cctv.code;
      tile.innerHTML = `
        <div class="feed"><svg style="width:32px; height:32px; opacity:0.3;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>
        <div class="cctv-label"><span class="rec"></span>${cctv.code} · LIVE</div>
        <div class="cctv-selected-badge">TERPILIH</div>
        <div class="cctv-time" data-clock>--:--:--</div>`;
      tile.addEventListener('click', () => {
        const ptr = ptrData.find(p => p.code === cctv.code);
        if (ptr && markers[ptr.code]) {
          map.setView([ptr.latitude, ptr.longitude], 10);
          markers[ptr.code].marker.openPopup();
        }
      });
      grid.appendChild(tile);
    });
    
    // CCTV clock
    const updateClock = () => {
      const t = new Date().toTimeString().split(' ')[0];
      document.querySelectorAll('[data-clock]').forEach(c => c.textContent = t);
    };
    updateClock();
    setInterval(updateClock, 1000);
  };

  // Epoch switch
  document.getElementById('epochSwitch')?.addEventListener('click', async (e) => {
    if (e.target.tagName === 'BUTTON') {
      document.querySelectorAll('#epochSwitch button').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentEpoch = e.target.dataset.epoch;
      await loadStats();
      await loadPtrData();
      // Clear and re-render markers
      Object.values(markers).forEach(m => map.removeLayer(m.marker));
      markers = {};
      renderMarkers();
    }
  });

  return { init, getPtrData:()=>ptrData, getCctvData:()=>cctvData, getCurrentEpoch:()=>currentEpoch };
})();

/* ============================================
   INVENTORY FORM
   ============================================ */
const Inventory = (() => {
  const form = document.getElementById('inventoryForm');
  const btnGps = document.getElementById('btnGps');
  const photoDrop = document.getElementById('photoDrop');
  const photoInput = document.getElementById('photoInput');
  const inspectionType = document.getElementById('inspectionType');
  let selectedPhotos = [];
  let inspectionTypeValue = 'rutin';

  btnGps?.addEventListener('click', () => {
    if (btnGps.classList.contains('loading')) return;
    btnGps.classList.add('loading');
    btnGps.innerHTML = '<span style="display:inline-block; animation:spin 1s linear infinite;">⟳</span> Mengambil GPS...';
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          document.getElementById('lat').textContent = `${lat}°`;
          document.getElementById('lng').textContent = `${lng}°`;
          btnGps.classList.remove('loading');
          btnGps.innerHTML = '<svg style="width:14px; height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> GPS Aktif · Refresh';
          Toast.show('success','GPS aktif',`Lokasi: ${lat}, ${lng}`);
        },
        () => {
          const lat = (-6.2+(Math.random()-0.5)*0.1).toFixed(6);
          const lng = (106.8+(Math.random()-0.5)*0.1).toFixed(6);
          document.getElementById('lat').textContent = `${lat}°`;
          document.getElementById('lng').textContent = `${lng}°`;
          btnGps.classList.remove('loading');
          btnGps.innerHTML = 'Mulai GPS (Demo)';
          Toast.show('warning','GPS tidak tersedia','Menggunakan lokasi simulasi');
        },
        { enableHighAccuracy:true, timeout:10000 }
      );
    }
  });

  photoDrop?.addEventListener('click', () => photoInput?.click());
  photoInput?.addEventListener('change', (e) => handleFiles(e.target.files));
  ['dragenter','dragover'].forEach(evt => photoDrop?.addEventListener(evt, (e) => { e.preventDefault(); photoDrop.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(evt => photoDrop?.addEventListener(evt, (e) => { e.preventDefault(); photoDrop.classList.remove('dragover'); }));
  photoDrop?.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));

  const handleFiles = (files) => {
    const newFiles = Array.from(files).slice(0, 3-selectedPhotos.length);
    selectedPhotos = [...selectedPhotos, ...newFiles].slice(0,3);
    if (selectedPhotos.length > 0) {
      photoDrop.innerHTML = `<strong>${selectedPhotos.length} foto terpilih</strong><span>${selectedPhotos.map(f=>f.name).join(', ')}</span><input type="file" id="photoInput" accept="image/*" multiple style="display:none;" />`;
      document.getElementById('photoInput')?.addEventListener('change', (e) => handleFiles(e.target.files));
    }
  };

  inspectionType?.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      inspectionType.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      inspectionTypeValue = e.target.dataset.value;
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btnSubmit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span style="display:inline-block; animation:spin 1s linear infinite;">⟳</span> Menyimpan...';
    try {
      const formData = new FormData(form);
      const data = {
        code: formData.get('code'),
        epoch: Dashboard.getCurrentEpoch(),
        latitude: parseFloat(document.getElementById('lat').textContent),
        longitude: parseFloat(document.getElementById('lng').textContent),
        region: formData.get('region'),
        condition_status: formData.get('condition_status'),
        tilt_degree: parseFloat(formData.get('tilt_degree'))||0,
        inspection_type: inspectionTypeValue,
        notes: formData.get('notes')
      };
      const result = await API.createPtr(data);
      if (selectedPhotos.length > 0 && result.id) await API.uploadPhotos(result.id, selectedPhotos);
      Toast.show('success','Data berhasil disimpan',`PTR ${data.code} telah dicatat`);
      form.reset();
      selectedPhotos = [];
      photoDrop.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><strong>Drop foto timestamp di sini</strong><span>JPG, PNG · atau klik untuk memilih</span><input type="file" id="photoInput" accept="image/*" multiple style="display:none;" />`;
      document.getElementById('photoInput')?.addEventListener('change', (e) => handleFiles(e.target.files));
      Dashboard.init();
    } catch (err) { Toast.show('error','Gagal menyimpan',err.message); }
    finally { submitBtn.disabled = false; submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Simpan ke Server'; }
  });

  document.getElementById('btnSaveDraft')?.addEventListener('click', () => {
    const formData = new FormData(form);
    const drafts = JSON.parse(localStorage.getItem('simptr-drafts')||'[]');
    drafts.push({ code:formData.get('code'), region:formData.get('region'), condition_status:formData.get('condition_status'), saved_at:new Date().toISOString() });
    localStorage.setItem('simptr-drafts', JSON.stringify(drafts));
    document.getElementById('draftStatus').textContent = `Draft · ${drafts.length} item`;
    Toast.show('info','Draft tersimpan','Data disimpan di browser');
  });

  const style = document.createElement('style');
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
})();

/* ============================================
   THEME TOGGLE
   ============================================ */
const Theme = (() => {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('simptr-theme');
  if (saved) root.setAttribute('data-theme', saved);
  btn?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('simptr-theme', next);
  });
})();

/* ============================================
   NAVIGATION
   ============================================ */
const Navigation = (() => {
  const items = document.querySelectorAll('.nav-item');
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      if (item.dataset.view === 'reports') return;
      e.preventDefault();
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('breadcrumbCurrent').textContent = item.textContent.trim();
    });
  });
})();

/* ============================================
   OFFLINE DETECTION
   ============================================ */
const Offline = (() => {
  const banner = document.getElementById('offlineBanner');
  const update = () => { if (!navigator.onLine) banner.classList.add('show'); else banner.classList.remove('show'); };
  window.addEventListener('online', () => { update(); Toast.show('success','Koneksi kembali','Data akan disinkronkan'); Dashboard.init(); });
  window.addEventListener('offline', update);
  update();
})();

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  console.log('%c SIM-PTR BNPP ', 'background:#0f766e; color:white; padding:4px 8px; border-radius:4px; font-weight:bold;', 'v2.4 · Supabase + Leaflet + Airbus');
});
