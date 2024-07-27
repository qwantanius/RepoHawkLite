import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ title }) => (
  <Helmet>
    <title>{title}</title>
  </Helmet>
);

export default SEO;
