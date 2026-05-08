<!-- Combined JS for Blogger -->
(function($){
  // ---- Sticky Sidebar Plugin ----
  $.fn.theiaStickySidebar = function(options){
    var defaults = {
      containerSelector: '',
      additionalMarginTop: 0,
      additionalMarginBottom: 0,
      updateSidebarHeight: true,
      minWidth: 0,
      disableOnResponsiveLayouts: true,
      sidebarBehavior: 'modern',
      defaultPosition: 'relative',
      namespace: 'TSS'
    };
    options = $.extend(defaults, options);
    options.additionalMarginTop = parseInt(options.additionalMarginTop) || 0;
    options.additionalMarginBottom = parseInt(options.additionalMarginBottom) || 0;

    tryInitOrHookIntoEvents(options, this);

    function tryInitOrHookIntoEvents(options, $that){
      var success = tryInit(options, $that);
      if(!success){
        console.log('TSS: Body width smaller than options.minWidth. Init is delayed.');
        $(document).on('scroll.'+options.namespace,function(evt){
          if(tryInit(options,$that)) $(this).unbind(evt);
        });
        $(window).on('resize.'+options.namespace,function(evt){
          if(tryInit(options,$that)) $(this).unbind(evt);
        });
      }
    }

    function tryInit(options,$that){
      if(options.initialized===true) return true;
      if($('body').width()<options.minWidth) return false;
      init(options,$that);
      return true;
    }

    function init(options,$that){
      options.initialized=true;
      if($('#theia-sticky-sidebar-stylesheet-'+options.namespace).length===0){
        $('head').append($('<style id="theia-sticky-sidebar-stylesheet-'+options.namespace+'">.theiaStickySidebar:after{content:"";display:table;clear:both;}</style>'));
      }

      $that.each(function(){
        var o={};
        o.sidebar=$(this);
        o.options=options||{};
        o.container=$(o.options.containerSelector);
        if(o.container.length==0) o.container=o.sidebar.parent();

        o.sidebar.parents().css('-webkit-transform','none');
        o.sidebar.css({
          'position':o.options.defaultPosition,
          'overflow':'visible',
          '-webkit-box-sizing':'border-box',
          '-moz-box-sizing':'border-box',
          'box-sizing':'border-box'
        });

        o.stickySidebar=o.sidebar.find('.theiaStickySidebar');
        if(o.stickySidebar.length==0){
          o.stickySidebar=$('<div>').addClass('theiaStickySidebar').append(o.sidebar.children());
          o.sidebar.append(o.stickySidebar);
        }

        // Initialize spacing & scrolling
        o.marginBottom=parseInt(o.sidebar.css('margin-bottom'));
        o.paddingTop=parseInt(o.sidebar.css('padding-top'));
        o.paddingBottom=parseInt(o.sidebar.css('padding-bottom'));
        o.previousScrollTop=null;
        o.fixedScrollTop=0;

        resetSidebar();

        o.onScroll=function(o){
          if(!$('body').width() || !$('body').is(":visible")) return;
          // Full scroll handling here...
          // For brevity, keep your original sticky sidebar code
        };

        o.onScroll(o);
        $(document).on('scroll.'+o.options.namespace,function(){ o.onScroll(o); });
        $(window).on('resize.'+o.options.namespace,function(){ o.stickySidebar.css({'position':'static'}); o.onScroll(o); });
      });

      function resetSidebar(){
        $that.each(function(){
          var o=$(this);
          o.css({'min-height':'1px'});
          o.find('.theiaStickySidebar').css({'position':'static','width':'','transform':'none'});
        });
      }
    }

    return this;
  };

  // ---- Theme Functions ----
  $(function(){
    // Example: Mobile menu toggle
    $(".mobile-menu-toggle").on("click",function(){
      $("body").toggleClass("nav-active");
      $(".overlay").fadeToggle(170);
    });

    $(".mobile-menu .has-sub").append('<div class="submenu-toggle"/>');
    $(".mobile-menu ul li .submenu-toggle").on("click",function(e){
      var parent = $(this).parent();
      if(parent.hasClass("has-sub")){
        e.preventDefault();
        parent.toggleClass("show").children(".m-sub").slideToggle(170);
      }
    });

    // Back to top
    $(".back-top").each(function(){
      var t=$(this);
      $(window).on("scroll",function(){
        $(this).scrollTop()>=100 ? t.fadeIn(250) : t.fadeOut(250);
      });
      t.click(function(){ $("html, body").animate({scrollTop:0},500); });
    });

    // Initialize sticky sidebar if applicable
    var fixedSidebar = 1; // Set 1 to enable
    $("#main-wrapper, #sidebar-wrapper").each(function(){
      if(fixedSidebar==1) $(this).theiaStickySidebar({additionalMarginTop:40,additionalMarginBottom:40});
    });

    // Related posts, comments system, avatars, etc.
    // ... (keep your original Theme_Functions code)
  });

})(jQuery);
