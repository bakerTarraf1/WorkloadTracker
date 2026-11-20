export const getWorkloadColor = (status: string) => {
  switch (status) {
    case 'Available': return '#4caf50';
    case 'Moderate': return '#ff9800';
    case 'Overloaded': return '#f44336';
    default: return '#grey';
  }
};

export const getWorkloadBg = (status: string) => {
  switch (status) {
    case 'Available': return '#e8f5e9';
    case 'Moderate': return '#fff3e0';
    case 'Overloaded': return '#ffebee';
    default: return '#f5f5f5';
  }
};

export const getPriorityLabel = (p: number) => {
  switch (p) {
    case 0: return 'Low';
    case 1: return 'Medium';
    case 2: return 'High';
    case 3: return 'Critical';
    default: return 'Unknown';
  }
};

export const getComplexityLabel = (c: number) => {
  switch (c) {
    case 0: return 'Simple';
    case 1: return 'Medium';
    case 2: return 'Complex';
    default: return 'Unknown';
  }
};

export const getStatusLabel = (s: number) => {
  switch (s) {
    case 0: return 'New';
    case 1: return 'In Progress';
    case 2: return 'Blocked';
    case 3: return 'Done';
    default: return 'Unknown';
  }
};

export const getChangeRequestTypeLabel = (t: number) => {
  switch (t) {
    case 0: return 'Change Owner';
    case 1: return 'Change Due Date';
    case 2: return 'Increase Effort';
    default: return 'Unknown';
  }
};