export function WebsiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bitmagnet',
    url: 'https://m.diao.im',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://m.diao.im/search?keyword={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function TorrentStructuredData({ 
  name, 
  hash, 
  size, 
  dateCreated, 
  dateModified 
}: {
  name: string;
  hash: string;
  size: number;
  dateCreated: string;
  dateModified: string;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name,
    identifier: hash,
    contentSize: `${size} bytes`,
    dateCreated,
    dateModified
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
