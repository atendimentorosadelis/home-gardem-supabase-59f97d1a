export function Stats() {
  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <p className="text-3xl font-bold text-primary">100+</p>
          <p className="text-muted-foreground">Articles</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">50+</p>
          <p className="text-muted-foreground">Plant Guides</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">10k+</p>
          <p className="text-muted-foreground">Readers</p>
        </div>
      </div>
    </section>
  );
}
