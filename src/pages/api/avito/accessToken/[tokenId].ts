import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'DELETE') {
    const { tokenId } = req.query;

    if (!tokenId || typeof tokenId !== 'string') {
      return res.status(400).json({ error: 'Invalid tokenId' });
    }

    const { error } = await supabase
      .from('avito_access_tokens')
      .delete()
      .eq('id', tokenId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Token deleted successfully' });
  }
}
