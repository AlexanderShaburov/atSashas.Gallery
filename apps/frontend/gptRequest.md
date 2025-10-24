Ok, I have specific input TS React component where desired value initially is undefined. Until all parts of multi parameters value be set, main handler couldn't be called because this multi parameters value can't be partially undefined. In this case I see two options:

- either make a local data type where every parameter can be defined or not and make provisional var where input values can be hold until all of them became defined and then call main handler,
- or orient on all inputs values fields until all of them obtain its values,
  checking different inputs value fields on every change in every of then. And then call main handler

I don't like both of them
