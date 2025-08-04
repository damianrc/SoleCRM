// Utility function to generate user initials
export const generateInitials = (userData) => {
  if (!userData) return 'U';
  
  if (userData.displayName) {
    const names = userData.displayName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
  
  // Fallback to email if no display name
  if (userData.email) {
    return userData.email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

// Utility function to get display name
export const getDisplayName = (userData) => {
  if (!userData) return 'User';
  
  if (userData.displayName && userData.displayName.trim()) {
    return userData.displayName.trim();
  }
  
  // Fallback to email without domain
  if (userData.email) {
    return userData.email.split('@')[0];
  }
  
  return 'User';
};
