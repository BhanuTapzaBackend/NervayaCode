export const checkIsActivePath = (pathname: string, itemPath: string, siblingPaths: string[] = []): boolean => {
  if (pathname === itemPath) return true;
  if (itemPath === '/') return false;

  const isSubPathMatch = pathname.startsWith(`${itemPath}/`);
  if (!isSubPathMatch) return false;

  const hasMoreSpecificSiblingMatch = siblingPaths.some(
    (siblingPath) =>
      siblingPath !== itemPath && pathname.startsWith(siblingPath) && siblingPath.length > itemPath.length,
  );

  return !hasMoreSpecificSiblingMatch;
};
