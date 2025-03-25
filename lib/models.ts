// lib/models.ts

import User from '@/models/User';
import { Message, Conversation } from '@/models/Message';

// Force model registration
const Models = {
  User,
  Message,
  Conversation
};

export default Models;