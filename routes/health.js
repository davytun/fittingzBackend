const { PrismaClient } = require("@prisma/client");
const { Router } = require("express");

const prisma = new PrismaClient();
const router = Router(); // ✅ Correct router instance

router.get("/db-test", async (req, res) => {
  const start = Date.now();
  try {
    await prisma.admin.findFirst();
    const duration = Date.now() - start;
    res.json({ ok: true, dbTimeMs: duration });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
