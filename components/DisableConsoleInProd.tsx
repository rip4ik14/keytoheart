'use client';

export default function DisableConsoleInProd() {
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    // если хочешь вообще пусто:
    // console.error = () => {};
  }
  return null;
}
