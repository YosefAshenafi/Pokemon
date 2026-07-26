import { reportError, setErrorReporter } from '../reportError';

afterEach(() => {
  setErrorReporter(null);
});

describe('reportError', () => {
  it('stays silent until a reporter is installed', () => {
    expect(() => reportError(new Error('boom'))).not.toThrow();
  });

  it('forwards the error and its context to the installed reporter', () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);

    const error = new Error('contract moved');
    reportError(error, { path: '/pokemon/1' });

    expect(reporter).toHaveBeenCalledWith(error, { path: '/pokemon/1' });
  });

  it('stops reporting once the reporter is removed', () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);
    setErrorReporter(null);

    reportError(new Error('boom'));

    expect(reporter).not.toHaveBeenCalled();
  });
});
