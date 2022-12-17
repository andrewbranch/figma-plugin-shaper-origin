import { Props } from "@create-figma-plugin/ui";
import { h, JSX } from "preact";

export interface WithCSSProperties {
  style?: JSX.CSSProperties;
}

export interface TableProps extends WithCSSProperties {}

export function Table({ children, ...props }: Props<HTMLTableElement, TableProps>) {
  return (
    <table {...props} style={{ width: '100%' }}>
      {children}
    </table>
  );
}

export function Row({ children, ...props }: Props<HTMLTableRowElement, {}>) {
  return (
    <tr {...props}>
      {children}
    </tr>
  );
}

export interface CellProps extends WithCSSProperties {
  width?: number;
}

export function Cell({ children, width, ...props }: Props<HTMLTableCellElement, CellProps>) {
  return (
    <td {...props} style={{ width, ...props.style }}>
      {children}
    </td>
  );
}
