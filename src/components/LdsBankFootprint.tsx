import type { ModeledLdsBank } from "../content/lds-bank-model";
/** Shared bounded arithmetic renderer; provenance belongs to the enclosing view. */
export function LdsBankFootprint({ banks }: { banks: readonly ModeledLdsBank[] }) {
  return <ul className="resource-lds-bank-grid" aria-label="Modeled LDS bank footprint">
    {banks.map(bank => <li key={bank.bank} data-touched={bank.byteCount !== 0 ? "true" : "false"}>
      <span>Bank {bank.bank}</span><span>{bank.distinctWords} words · {bank.byteCount} bytes</span>
    </li>)}
  </ul>;
}
