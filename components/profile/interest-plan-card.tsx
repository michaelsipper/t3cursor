// components/profile/interest-plan-card.tsx
import { MapPin, Calendar, Clock, Users } from 'lucide-react';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import type { FeedItem } from '@/lib/types';

interface InterestPlanCardProps {
 plan: FeedItem;
 status?: 'pending' | 'accepted' | 'rejected';
}

export function InterestPlanCard({ plan, status = 'pending' }: InterestPlanCardProps) {
 const getCardStyle = () => {
   switch(status) {
     case 'accepted': return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
     case 'rejected': return 'bg-gradient-to-r from-red-400 to-red-500 opacity-50';
     default: return 'bg-gradient-to-r from-blue-500 to-blue-600';
   }
 };

 const formatDate = (dateString?: string | number) => {
   if (!dateString) return '';
   const date = new Date(dateString);
   if (!isValid(date)) return '';
   return format(date, 'EEE, MMM d');
 };

 const formatTime = (dateString?: string | number) => {
   if (!dateString) return '';
   const date = new Date(dateString);
   if (!isValid(date)) return '';
   return format(date, 'h:mm a');
 };

 const formatStartsAgo = (dateString?: string | number) => {
   if (!dateString) return '';
   const date = new Date(dateString);
   if (!isValid(date)) return '';
   return `Starts ${formatDistanceToNow(date)} ago`;
 };

 const hostSection = (
   <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900">
     {plan.poster.avatarUrl ? (
       <img src={plan.poster.avatarUrl} alt={plan.poster.name} 
         className="w-8 h-8 rounded-lg bg-zinc-100" />
     ) : (
       <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
     )}
     <div>
       <div className="font-medium text-zinc-900 dark:text-white">
         {plan.poster.name}
       </div>
       <div className="text-sm text-zinc-500">Host</div>
     </div>
   </div>
 );

 return (
   <div className={`w-[300px] rounded-xl overflow-hidden ${getCardStyle()}`}>
     <div className="p-4 text-white">
       <h2 className="text-xl font-bold mb-2">{plan.event.title}</h2>
       <div className="flex items-center gap-2">
         <MapPin className="w-4 h-4" />
         <span className="text-sm">
           {typeof plan.event.location === 'string' ? plan.event.location : plan.event.location.name}
         </span>
       </div>
     </div>

     {hostSection}

     <div className="p-4 bg-white dark:bg-zinc-900 space-y-2">
       <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
         <Calendar className="w-4 h-4" />
         <span className="text-sm">{formatDate(plan.event.time)}</span>
       </div>

       <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
         <Clock className="w-4 h-4" />
         <span className="text-sm">{formatTime(plan.event.time)}</span>
       </div>

       <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
         <Users className="w-4 h-4" />
         <span className="text-sm">
           {plan.event.participants.length}/{plan.event.totalSpots} going • {plan.event.totalSpots - plan.event.participants.length} spots left
         </span>
       </div>

       <div className="text-purple-500 text-sm">
         {formatStartsAgo(plan.event.time)}
       </div>

       <p className="text-sm text-zinc-600 dark:text-zinc-400 pt-2">
         {plan.event.description}
       </p>

       {status === 'accepted' && (
         <button className="w-full mt-4 py-3 bg-emerald-500 text-white rounded-lg font-medium">
           Confirm Going
         </button>
       )}
     </div>
   </div>
 );
}