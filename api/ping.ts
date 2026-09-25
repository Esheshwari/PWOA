export default function handler(_req: any, res: any): void {
  res.status(200).json({
    ok: true,
    message: 'Vercel function works',
  });
}