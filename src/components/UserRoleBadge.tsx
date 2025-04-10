type Props = {
  role: string | undefined;
};

type roleType = 'admin' | 'client' | 'cleaner';

const UserRoleBadge = ({ role }: Props) => {
  if (!role || !['admin', 'client', 'cleaner'].includes(role)) return null; // Handle case where role is undefined or invalid

  const roleStyles = {
    admin: 'bg-blue-100 text-blue-700',
    client: 'bg-green-100 text-green-700',
    cleaner: 'bg-purple-100 text-purple-700',
  };

  const roleTitles = {
    admin: 'Администратор',
    client: 'Клиент',
    cleaner: 'Уборщик(ца)',
  };

  return (
    <div
      className={`${
        roleStyles[role as roleType]
      } px-2 py-1 rounded text-xs font-medium w-max`}
    >
      {roleTitles[role as roleType]}
    </div>
  );
};

export default UserRoleBadge;
