//mock-data.ts

import { FeedItem } from "@/lib/types";

export const feedItems: FeedItem[] = [
  {
    id: 1,
    type: "scheduled",
    poster: {
      name: "Michael Sipper",
      age: 22,
      connection: "1st",
    },
    event: {
      title: "Catan with me and @Austin",
      description: "I have beer, but bring more",
      time: "8:00 PM Today",
      location: "Mission District, SF",
      currentInterested: 3,
      openInvite: false,
      totalSpots: 6,
      participants: [
        { id: 1, name: "Michael Sipper", avatar: null },
        { id: 2, name: "Austin Ritz", avatar: null },
      ],
    },
  },
  {
    id: 2,
    type: "scheduled",
    poster: {
      name: "Zach Sorscher",
      age: 25,
      connection: "1st",
    },
    event: {
      title: "Morning surf sesh at Four Mile",
      description: "Have 2 extra wet suits!",
      time: "5:00 AM Tomorrow",
      location: "Four Mile, Santa Cruz",
      currentInterested: 1,
      openInvite: false,
      totalSpots: 5,
      participants: [
        { id: 3, name: "Zach Sorscher", avatar: null },
        { id: 4, name: "Suki Chen", avatar: null },
        { id: 5, name: "Katie Brown", avatar: null },
      ],
    },
  },
  {
    id: 3,
    type: "realtime",
    poster: {
      name: "Brandon Wilson",
      age: 22,
      connection: "2nd",
    },
    event: {
      title: "Pick-up Basketball",
      description: "Come through, more ppl the better",
      startTime: new Date().getTime() - 30 * 60 * 1000,
      duration: 2,
      location: "Mission Bay Courts, SF",
      currentInterested: 8,
      openInvite: true,
      // Add these missing fields
      totalSpots: 10,
      participants: [{ id: 6, name: "Brandon Wilson", avatar: null }],
    },
  },
  {
    id: 4,
    type: "scheduled",
    poster: {
      name: "Lindsay Turner",
      age: 21,
      connection: "3rd",
    },
    event: {
      title: "Club Raven Halloween Weekend",
      description:
        "A Night of Throwbacks with a Few Future Throwbacks featuring Resident Video DJs Mark Andrus & Jorge Terez",
      time: "Friday, October 25, 9PM-2AM",
      location: "Club Raven, SF",
      currentInterested: 120,
      openInvite: true,
      totalSpots: 300, // Large venue capacity
      participants: [
        { id: 11, name: "Lindsay Turner", avatar: null },
        { id: 12, name: "Mark Andrus", avatar: null },
        { id: 13, name: "Jorge Terez", avatar: null },
        // Adding some example early participants
        { id: 14, name: "Emma Davis", avatar: null },
        { id: 15, name: "James Wilson", avatar: null },
      ],
    },
  },
  {
    id: 5,
    type: "scheduled",
    poster: {
      name: "Mailys Nasr",
      age: 26,
      connection: "2nd",
    },
    event: {
      title: "House Party!",
      description:
        "Celebrating @Victoire's birthday! MUST wear Halloween costume. BYOB!",
      time: "Saturday, October 26, 9PM-3AM",
      location: "Hayes Valley, SF",
      currentInterested: 45,
      openInvite: true,
      totalSpots: 50,
      participants: [
        { id: 16, name: "Mailys Nasr", avatar: null },
        { id: 17, name: "Victoire De Mauduit", avatar: null },
      ],
    },
  },
  {
    id: 6,
    type: "scheduled",
    poster: {
      name: "Alex Kumar",
      age: 31,
      connection: "2nd",
    },
    event: {
      title: "Morning Hike",
      description:
        "Planning a moderate 5-mile hike at Lands End. Looking to meet 2 new hiking buddies!",
      time: "Tomorrow, 8:00 AM",
      location: "Lands End Trail, SF",
      currentInterested: 3,
      openInvite: false,
      totalSpots: 3, // Specifically mentioned wanting 2 more people
      participants: [{ id: 21, name: "Alex Kumar", avatar: null }],
    },
  },
  {
    id: 7,
    type: "realtime",
    poster: {
      name: "Jenny Park",
      age: 27,
      connection: "3rd",
    },
    event: {
      title: "Pop-up Art Show",
      description: "Showcasing local artists. Free wine! Come through!",
      startTime: new Date().getTime(),
      duration: 4,
      location: "SOMA, SF",
      currentInterested: 12,
      openInvite: true,
      totalSpots: 40, // Typical gallery capacity
      participants: [
        { id: 22, name: "Jenny Park", avatar: null },
        { id: 23, name: "Lisa Chen", avatar: null },
        { id: 24, name: "Robert Kim", avatar: null },
        { id: 25, name: "Maria Garcia", avatar: null },
      ],
    },
  },
  {
    id: 8,
    type: "repost",
    repostMessage: "We should do this Friday night! Who's down?",
    poster: {
      name: "Jessica Kim",
      age: 22,
      connection: "1st",
    },
    event: {
      title: "Club Raven Halloween Weekend",
      description:
        "A Night of Throwbacks with a Few Future Throwbacks featuring Resident Video DJs Mark Andrus & Jorge Terez",
      time: "Friday, October 25, 9PM-2AM",
      location: "Club Raven, SF",
      currentInterested: 3,
      openInvite: true,
      totalSpots: 300,
      participants: [
        { id: 11, name: "Lindsay Turner", avatar: null },
        { id: 12, name: "Mark Andrus", avatar: null },
        { id: 13, name: "Jorge Terez", avatar: null },
        { id: 14, name: "Emma Davis", avatar: null },
        { id: 15, name: "James Wilson", avatar: null },
        { id: 26, name: "Jessica Kim", avatar: null },
      ],
      originalPoster: {
        name: "Lindsay Turner",
        age: 21,
        connection: "3rd",
      },
    },
  },
];
