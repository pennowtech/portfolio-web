export const logPageView = (url) => {
  if (window !== undefined) {
    window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS, {
      page_path: url,
    });
  }
};

export const logEevent = ({action, category, params}) => {
  if (window !== undefined) {
    window.gtag("event", action, {
      event_category: category,
      params: params,
    });
  }
};
