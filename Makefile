REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require chai \
		--reporter $(REPORTER) \
		--timeout 15000

.PHONY: test

