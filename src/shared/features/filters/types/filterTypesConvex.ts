/** A validated filter fragment that can be converted to a Convex index range. */
export type ConvexFilterScalar = string | number | boolean;

export type ConvexFilter = {
	field: string;
	eq?: ConvexFilterScalar;
	gte?: number;
	lt?: number;
};

/** A symbolic filter value mapped to one indexed Convex filter fragment. */
export type FilterPredicate = (value: string) => ConvexFilter | undefined;

/** Maps a symbolic filter key and value to an indexed Convex filter fragment. */
export type FilterPredicateFor = (key: string, value: string) => ConvexFilter | undefined;
