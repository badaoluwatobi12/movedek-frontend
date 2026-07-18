export const isEmail = (value: string) => /.+@.+\..+/.test(value);
export const isPhone = (value: string) => value.replace(/\D/g, "").length >= 10;
