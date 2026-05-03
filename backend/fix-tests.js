const fs = require('fs');

const files = [
  'tests/multiuser.test.js',
  'tests/pentest.test.js',
  'tests/logic.test.js',
  'tests/auth.test.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/findOneAndUpdate\(\{ email \}/g, 'findOneAndUpdate({ email: email.toLowerCase() })');
  // Handle auth.test.js direct passing
  content = content.replace(/findOneAndUpdate\(\{ email: 'me@srmap.edu.in' \}/g, "findOneAndUpdate({ email: 'me@srmap.edu.in'.toLowerCase() })");
  content = content.replace(/findOneAndUpdate\(\{ email: 'login@srmap.edu.in' \}/g, "findOneAndUpdate({ email: 'login@srmap.edu.in'.toLowerCase() })");
  content = content.replace(/findOneAndUpdate\(\{ email: 'verify@srmap.edu.in' \}/g, "findOneAndUpdate({ email: 'verify@srmap.edu.in'.toLowerCase() })");
  
  fs.writeFileSync(file, content);
}
console.log('Fixed email case for test runners!');
