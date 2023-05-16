class LoggerService {
  event({ event, metaData }) {
    console.info({
      event,
      metaData,
    });
  }

  error({ event, stackTrace, message }) {
    console.error({ event, stackTrace, message });
  }
}

module.exports = new LoggerService();
