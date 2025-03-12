// Type declarations for visualization components
declare module './highlight' {
  export function Highlight({ data, title }: { data: any[], title?: string }): JSX.Element;
}

declare module './line-chart' {
  export function LineChart({ data }: { data: any[] }): JSX.Element;
}

declare module './bar-chart' {
  export function BarChart({ data }: { data: any[] }): JSX.Element;
}

declare module './data-table' {
  export function DataTable({ data }: { data: any[] }): JSX.Element;
}
