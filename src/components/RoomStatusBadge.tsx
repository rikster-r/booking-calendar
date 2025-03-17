import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Mop from '@/assets/mop.svg';

type Props = {
  status: 'ready' | 'not ready' | 'cleaning';
};

const RoomStatusBadge = ({ status }: Props) => {
  const statusMap = {
    ready: {
      label: 'Ready',
      icon: <CheckIcon className="w-5 h-5 text-green-500" />,
      bg: 'bg-green-100 text-green-700',
    },
    'not ready': {
      label: 'Not Ready',
      icon: <XMarkIcon className="w-5 h-5 text-red-500" />,
      bg: 'bg-red-100 text-red-700',
    },
    cleaning: {
      label: 'Cleaning',
      icon: <Image src={Mop} alt="Cleaning" className="w-5 h-5" />,
      bg: 'bg-yellow-100 text-yellow-700',
    },
  };

  const { icon } = statusMap[status];

  return (
    <div className={`flex items-center gap-2 p-1`}>
      {icon}
    </div>
  );
};

export default RoomStatusBadge;
