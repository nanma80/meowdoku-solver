// Lexicographic permutations, matching the original Python brute-force approach.
export function solve(colors) {
  const n = colors.length;
  const p = Array.from({length:n}, (_,i)=>i);
  do {
    if (p.every((col,row)=>row === 0 || Math.abs(col-p[row-1]) >= 2) &&
        new Set(p.map((col,row)=>colors[row][col])).size === n) return [...p];
    let i=n-2;
    while(i>=0 && p[i]>=p[i+1]) i--;
    if(i<0) return null;
    let j=n-1;
    while(p[j]<=p[i]) j--;
    [p[i],p[j]]=[p[j],p[i]];
    for(let a=i+1,b=n-1;a<b;a++,b--) [p[a],p[b]]=[p[b],p[a]];
  } while(true);
}
