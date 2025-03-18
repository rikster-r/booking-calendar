import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Mop from '@/assets/mop.svg';

type Props = {
  status: 'ready' | 'not ready' | 'cleaning';
};

const RoomStatusBadge = ({ status }: Props) => {
  const statusMap = {
    ready: <CheckIcon className="w-5 h-5 text-green-500" />,
    'not ready': <XMarkIcon className="w-5 h-5 text-red-500" />,
    cleaning: <Image src={Mop} alt="Cleaning" className="w-5 h-5" />,
  };

  const icon = statusMap[status];

  return <div className={`flex items-center gap-2 p-1`}>{icon}</div>;
};

export default RoomStatusBadge;
