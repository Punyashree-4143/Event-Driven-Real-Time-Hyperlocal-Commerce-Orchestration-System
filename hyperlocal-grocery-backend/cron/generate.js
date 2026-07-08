const bcrypt = require("bcrypt");

(async () => {
  const password = "Surya@123"; // Change to your desired password
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
})();