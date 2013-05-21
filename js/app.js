/*global jQuery, Handlebars */
jQuery(function($) {
	'use strict';

	var Utils = {
		ajax: function(url, success, context) {
			$.ajax({
				type: "POST",
				url: url,
				dataType: 'jsonp'
			}).done(function(msg) {
				success.call(context, msg);
			});
		},
		events: $({})
	};

	var App = {
		init: function() {
			var that = this;
			this.apiKey = '23afca60ebf72f8d88cdcae2c4f31866';
			this.baseUrl = 'http://api.themoviedb.org/3/';
			this.imageUrl = '';
			this.films = [];
			this.actors = [];
			this.titles = [];
			this.doRender = [];
			this.urlParams = [];
			this.classTranslate = ['first', 'second'];
			this.cacheElements();
			this.bindEvents();
			this.setupUi();
			this.getConfig();
			if (window.location.hash) {
				Utils.events.on('ready', function() {
					var actors = window.location.hash.replace('#', '').split(',');
					that.handleSearch(actors);
					for (var i = 0; i < that.$inputs.length; i++) {
						that.$inputs[i].value = actors[i];
					}
				});
			} else {
				var actors = [
				'Ryan Gosling',
				'Emma Stone',
				'Bryan Cranston',
				'Oscar Isaac',
				'Michael Fassbender',
				'Carey Mulligan'];
				actors.sort(this.randomise);
				for (var i = 0; i < that.$inputs.length; i++) {
					that.$inputs[i].value = actors[i];
				}
			}
		},
		randomise: function() {
			return (Math.round(Math.random())-0.5);
		},
		buildPersonSearchUrl: function(person) {
			return this.baseUrl + 'search/person?query=' + person + '&api_key=' + this.apiKey;
		},
		buildMovieListUrl: function(id) {
			return this.baseUrl + 'person/' + id + '/credits?api_key=' + this.apiKey;
		},
		buildConfigUrl: function() {
			return this.baseUrl + 'configuration?api_key=' + this.apiKey;
		},
		buildPopularUrl: function() {
			return this.baseURL + 'person/popular?api_key=' + this.apiKey;
		},
		getConfig: function() {
			var that = this;
			Utils.ajax(this.buildConfigUrl(), that.saveConfig, that);
		},
		saveConfig: function(json) {
			this.imageUrl = json.images.base_url + 'w185/';
			Utils.events.trigger('ready');
		},
		storeActor: function(json) {
			var that = this;
			if (!json.results.length) {
				that.renderEmptyResults();
				this.$loading.hide();
				return false;
			}
			var id = json.results[0].id;
			var name = json.results[0].name;
			var profile = that.imageUrl + json.results[0].profile_path;
			var i = (this.actors.length == 1) ? 1 : 0;
			var data = {
				id: id,
				name: name,
				actorClass: this.classTranslate[i],
				profile: profile
			};
			this.actors.push(data);
			Utils.ajax(that.buildMovieListUrl(id), that.storeFilms, that);
		},
		storeFilms: function(json) {
			var x = 0;
			for (x in json.cast) {
				var title = json.cast[x].original_title;
				var poster = this.imageUrl + json.cast[x].poster_path;
				this.films.push({
					title: title,
					poster: poster
				});
			}
			this.doRender.push(true);
			if (this.doRender.length > 1) {
				this.getMatches(this.films);
				if (this.films.length) {
					this.renderResults();
				} else {
					this.populateErrors();
					this.renderNoResults();
				}
				this.$loading.hide();
			}
		},
		populateErrors: function() {
			this.$errorFirstActor.text(this.actors[0].name);
			this.$errorSecondActor.text(this.actors[1].name);
		},
		getMatches: function(movies) {
			var temp = {}, newArr = [];
			for (var k = 0; k < movies.length; k++) {
				if (temp[movies[k].title]) {
					newArr.push(movies[k]);
				}

				temp[movies[k].title] = true;
			}
			this.films = newArr;
		},
		cacheElements: function() {
			this.$films = $('#films');
			this.$actors = $('.actors');
			this.$controls = $('.controls');
			this.$noResults = $('.no-results');
			this.$yesResults = $('.yes-results');
			this.$emptyResults = $('.empty-results');
			this.$loading = $('#loading');
			this.$tweet = $('.tweet');
			this.$errorFirstActor = $('#firstActor', this.$noResults);
			this.$errorSecondActor = $('#secondActor', this.$noResults);
			this.$inputs = $('.inputs input[type="text"]');
			this.filmTemplate = Handlebars.compile($('#film-template').html());
			this.actorTemplate = Handlebars.compile($('#actor-template').html());
		},
		bindEvents: function() {
			var controls = this.$controls;
			var that = this;
			controls.on('click', 'button', function() {
				that.search();
			});
			this.$inputs.on('keyup', function(e) {
				if (e.keyCode == 13) {
					that.search();
				}
			});
			this.$tweet.on('click', function() {
				var msg = encodeURIComponent(that.$inputs[0].value + ' and ' + that.$inputs[1].value);
				var url = encodeURIComponent($('#shortURL')[0].value);
				var link = 'http://twitter.com/intent/tweet?text=' + msg + '&url=' + url;
				window.open(link);
			});
		},
		resetStates: function() {
			this.showLoading();
			this.actors = [];
			this.films = [];
			this.titles = [];
			this.doRender = [];
		},
		handleSearch: function(actors) {
			this.resetStates();
			if (actors.length) {
				for (var x in actors) {
					Utils.ajax(this.buildPersonSearchUrl(actors[x]), this.storeActor, this);
				}
			}
		},
		search: function() {
			var that = this;
			var tmp = [];
			that.urlParams = [];
			this.$inputs.each(function() {
				if (this.value === '') return;
				tmp.push(this.value);
				that.urlParams.push(this.value);
			});
			this.handleSearch(tmp);
			this.newUrl();
		},
		newUrl: function() {
			if (this.urlParams.length > 1) {
				window.location.hash = this.urlParams.join(',');
			}
		},
		showLoading: function() {
			this.$loading.show();
			this.$noResults.hide();
			this.$emptyResults.hide();
			this.$yesResults.hide();
		},
		setupUi: function() {
			this.$noResults.hide();
			this.$yesResults.hide();
			this.$emptyResults.hide();
		},
		renderResults: function() {
			this.$films.html(this.filmTemplate(this.films));
			this.$actors.html(this.actorTemplate(this.actors));
			this.$noResults.hide();
			this.$emptyResults.hide();
			this.$yesResults.show();
			var patternURL = encodeURIComponent(window.location.href);
			var url = "http://api.bitly.com/v3/shorten?login=benhowdle89&apiKey=R_01f556645116f8620103c31e48d7f2a2&longUrl=" + patternURL + "&format=txt";
			$.get(url, function(data) {
				$("#shortURL").val(data).show().focus().select();
			});
		},
		renderNoResults: function() {
			this.$noResults.show();
			this.$emptyResults.hide();
			this.$yesResults.hide();
		},
		renderEmptyResults: function() {
			this.$noResults.hide();
			this.$yesResults.hide();
			this.$emptyResults.show();
		}
	};

	App.init();

});