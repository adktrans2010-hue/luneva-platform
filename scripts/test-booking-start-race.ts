import { createBookingStartLifecycle } from "../src/lib/booking-start-lifecycle";
import assert from "node:assert/strict";
import { METRIKA_READY_EVENT } from "../src/lib/client-analytics";
Object.assign(process.env, { NODE_ENV: "production", NEXT_PUBLIC_YANDEX_METRIKA_ID: "113474556" });
const store = new Map<string,string>([["luneva_cookie_consent","accepted"]]);
const events = new EventTarget();
const calls: unknown[][] = [];
const internal: unknown[] = [];
let failInternal = false;
Object.defineProperty(globalThis,"document",{value:{title:"test",referrer:""}, configurable:true});
Object.defineProperty(globalThis,"fetch",{value: async (_url:unknown, init: {body:string}) => {
 internal.push(JSON.parse(init.body));
 if(failInternal) throw new Error("test unavailable");
 return {ok:true};
}, configurable:true});
Object.defineProperty(globalThis,"window",{ value: Object.assign(events, {
 localStorage: {getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)},
 sessionStorage: {getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)},
 __lunevaMetrikaActive:false, ym:(...args:unknown[])=>calls.push(args)
}), configurable:true });

Object.defineProperty(window,"location",{value:{pathname:"/contacts"}, configurable:true});

let form=createBookingStartLifecycle();
form.interact({}); form.interact({}); assert.equal(calls.length,0);
window.__lunevaMetrikaActive=true;
window.dispatchEvent(new Event(METRIKA_READY_EVENT));
form.interact({}); assert.equal(calls.length,1);
form.dispose();
form=createBookingStartLifecycle(); form.interact({}); assert.equal(calls.length,2,"reopened form"); form.dispose();
for (const mode of ["navigation","unmount","consent","pagehide","popstate"]) {
 window.location.pathname="/contacts"; store.set("luneva_cookie_consent","accepted"); window.__lunevaMetrikaActive=false;
 form=createBookingStartLifecycle(); form.interact({});
 if(mode==="navigation") window.location.pathname="/rpp";
 if(mode==="unmount") form.dispose();
 if(mode==="consent") { store.set("luneva_cookie_consent","rejected"); window.dispatchEvent(new Event("luneva:cookie-consent")); }
 if(mode==="pagehide" || mode==="popstate") window.dispatchEvent(new Event(mode));
 window.__lunevaMetrikaActive=true; window.dispatchEvent(new Event(METRIKA_READY_EVENT));
 assert.equal(calls.length,2,mode); form.dispose();
}
window.location.pathname="/contacts"; store.set("luneva_cookie_consent","rejected");
form=createBookingStartLifecycle(); form.interact({}); assert.equal(calls.length,2);
store.set("luneva_cookie_consent","accepted"); form.interact({}); form.interact({}); assert.equal(calls.length,3); form.dispose();
form=createBookingStartLifecycle(); window.dispatchEvent(new Event(METRIKA_READY_EVENT)); assert.equal(calls.length,3,"no artificial event on mount"); form.dispose();
console.log("booking_lifecycle_tests=PASS");

assert.equal(internal.length,8,"one internal attempt per interacted consented instance");
failInternal=true;
form=createBookingStartLifecycle(); form.interact({}); form.interact({});
assert.equal(calls.length,4,"internal outage does not block or duplicate Metrika");
assert.equal(internal.length,9); form.dispose();
console.log("partial_success_both_channels=PASS");

