import { useParams } from 'react-router-dom';
import { ClientCard } from './ClientCard';
import { ClientsList } from './ClientsList';

export default function ClientsPage() {
  const { id } = useParams();
  if (id) return <ClientCard clientId={Number(id)} />;
  return <ClientsList />;
}
