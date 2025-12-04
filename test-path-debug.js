const path = require('path');

// Simular o caminho da rota
const routePath = path.join(__dirname, 'apps', 'api', 'src', 'routes', 'icone.routes.js');
console.log('Route path:', routePath);

// Simular o caminho do upload a partir da rota
const uploadDirFromRoute = path.join(path.dirname(routePath), '../../../uploads/icones');
console.log('\nUpload dir from route:', path.resolve(uploadDirFromRoute));

// Verificar onde realmente está
const actualUploadDir = path.join(__dirname, 'uploads', 'icones');
console.log('Actual upload dir:', path.resolve(actualUploadDir));

// Comparar
console.log('\nAre they the same?', path.resolve(uploadDirFromRoute) === path.resolve(actualUploadDir));
