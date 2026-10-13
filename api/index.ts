let appInstance: any = null;

export default async function (req: any, res: any) {
  try {
    if (!appInstance) {
      const mod = await import('../server/app.js');
      appInstance = mod.default;
    }
    return appInstance(req, res);
  } catch (err: any) {
    console.error('Fatal initialization error:', err);
    res.status(500).json({ error: 'Fatal init error', message: err?.message, stack: err?.stack });
  }
}

