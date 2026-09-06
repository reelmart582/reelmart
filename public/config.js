const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://reelmart.onrender.com';

const API_BASE    = BASE_URL + '/api';
const UPLOADS_URL = BASE_URL + '/uploads/';

window.BASE_URL    = BASE_URL;
window.API_BASE    = API_BASE;
window.UPLOADS_URL = UPLOADS_URL;