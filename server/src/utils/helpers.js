export function parseNaturalLanguage(text) {
  const result = {
    title: text.trim(),
    dueDate: null,
    dueTime: null,
    priority: null,
    tags: [],
    projectId: null,
    recurrence: null
  };

  // Extract priority
  const priorityPatterns = [
    { regex: /\bp1\b/i, priority: 1 },
    { regex: /\bp2\b/i, priority: 2 },
    { regex: /\bp3\b/i, priority: 3 },
    { regex: /\bp4\b/i, priority: 4 },
    { regex: /\burgent\b/i, priority: 1 },
    { regex: /\bhigh\s*priority\b/i, priority: 2 },
    { regex: /\bmedium\s*priority\b/i, priority: 3 },
    { regex: /\blow\s*priority\b/i, priority: 4 }
  ];

  for (const p of priorityPatterns) {
    if (p.regex.test(result.title)) {
      result.priority = p.priority;
      result.title = result.title.replace(p.regex, '').trim();
      break;
    }
  }

  // Extract tags (#tag or @tag)
  const tagMatches = result.title.match(/[#@](\w+)/g);
  if (tagMatches) {
    result.tags = tagMatches.map(t => t.slice(1).toLowerCase());
    result.title = result.title.replace(/[#@]\w+/g, '').trim();
  }

  // Extract time (5pm, 5:30pm, 17:00, at 5pm)
  const timeRegex = /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const timeMatch = result.title.match(timeRegex);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    if (!ampm && hour >= 1 && hour <= 7) hour += 12; // assume PM for 1-7 without am/pm

    if (hour >= 0 && hour <= 23) {
      result.dueTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      result.title = result.title.replace(timeMatch[0], '').trim();
    }
  }

  // Extract date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const datePatterns = [
    { regex: /\btoday\b/i, getDate: () => new Date(today) },
    { regex: /\btomorrow\b/i, getDate: () => { const d = new Date(today); d.setDate(d.getDate() + 1); return d; } },
    { regex: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      getDate: (match) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = days.indexOf(match[1].toLowerCase());
        const d = new Date(today);
        const currentDay = d.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        d.setDate(d.getDate() + diff);
        return d;
      }
    },
    { regex: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      getDate: (match) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = days.indexOf(match[1].toLowerCase());
        const d = new Date(today);
        const currentDay = d.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        d.setDate(d.getDate() + diff);
        return d;
      }
    },
    { regex: /\bon\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
      getDate: (match) => {
        const day = parseInt(match[1]);
        const d = new Date(today);
        d.setDate(day);
        if (d < today) d.setMonth(d.getMonth() + 1);
        return d;
      }
    },
    { regex: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
      getDate: (match) => {
        const month = parseInt(match[1]) - 1;
        const day = parseInt(match[2]);
        const year = match[3] ? parseInt(match[3]) : today.getFullYear();
        return new Date(year < 100 ? 2000 + year : year, month, day);
      }
    },
    { regex: /\bin\s+(\d+)\s+days?\b/i,
      getDate: (match) => {
        const d = new Date(today);
        d.setDate(d.getDate() + parseInt(match[1]));
        return d;
      }
    }
  ];

  for (const pattern of datePatterns) {
    const match = result.title.match(pattern.regex);
    if (match) {
      result.dueDate = pattern.getDate(match);
      result.title = result.title.replace(match[0], '').trim();
      break;
    }
  }

  // Extract recurrence
  const recurrencePatterns = [
    { regex: /\bevery\s+day\b/i, recurrence: { type: 'daily', interval: 1 } },
    { regex: /\bevery\s+weekday\b/i, recurrence: { type: 'weekdays', interval: 1 } },
    { regex: /\bevery\s+week\b/i, recurrence: { type: 'weekly', interval: 1 } },
    { regex: /\bevery\s+month\b/i, recurrence: { type: 'monthly', interval: 1 } },
    { regex: /\bevery\s+year\b/i, recurrence: { type: 'yearly', interval: 1 } },
    { regex: /\bdaily\b/i, recurrence: { type: 'daily', interval: 1 } },
    { regex: /\bweekly\b/i, recurrence: { type: 'weekly', interval: 1 } },
    { regex: /\bmonthly\b/i, recurrence: { type: 'monthly', interval: 1 } },
    { regex: /\byearly\b/i, recurrence: { type: 'yearly', interval: 1 } }
  ];

  for (const pattern of recurrencePatterns) {
    if (pattern.regex.test(result.title)) {
      result.recurrence = pattern.recurrence;
      result.title = result.title.replace(pattern.regex, '').trim();
      break;
    }
  }

  // Clean up extra spaces
  result.title = result.title.replace(/\s+/g, ' ').trim();

  // If title is empty after parsing, restore original
  if (!result.title) {
    result.title = text.trim();
  }

  return result;
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getStartOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getStartOfWeek(date = new Date(), startsOn = 1) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - startsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfWeek(date = new Date(), startsOn = 1) {
  const start = getStartOfWeek(date, startsOn);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getStartOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
