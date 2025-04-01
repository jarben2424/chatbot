// Map user emails to program IDs
export interface ProgramMapping {
  programId: number;
  email: string;
  isAdmin?: boolean;
}

// Specific user mappings (for special cases)
const SPECIFIC_MAPPINGS: ProgramMapping[] = [
  // Add brian@hang.com as an admin user
  { email: 'brian@hang.com', programId: 0, isAdmin: true }
];

// Domain-based mappings
const DOMAIN_MAPPINGS: Record<string, { programId: number, isAdmin: boolean }> = {
  // Removed hang.com domain mapping to program ID 1515
  // Add other domain mappings as needed
};

// Default program ID to use if no mapping exists
const DEFAULT_PROGRAM_ID = 1000;

/**
 * Get program ID for a given user email
 */
export function getProgramIdForUser(email?: string | null): { programId: number, isAdmin: boolean } {
  if (!email) return { programId: DEFAULT_PROGRAM_ID, isAdmin: false };
  
  // First check for specific user mappings
  const specificMapping = SPECIFIC_MAPPINGS.find(m => 
    m.email.toLowerCase() === email.toLowerCase()
  );
  
  if (specificMapping) {
    return { 
      programId: specificMapping.programId, 
      isAdmin: !!specificMapping.isAdmin 
    };
  }
  
  // Then check for domain-based mappings
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && DOMAIN_MAPPINGS[domain]) {
    return DOMAIN_MAPPINGS[domain];
  }
  
  // Fall back to default program ID
  return { programId: DEFAULT_PROGRAM_ID, isAdmin: false };
} 