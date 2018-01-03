{
	'variables': {
		'opengl_root'   : '<!(node -e "console.log(require(\'node-deps-opengl-raub\').root)")',
		'opengl_include': '<(opengl_root)/include',
		'opengl_bin'    : '<!(node -e "console.log(require(\'node-deps-opengl-raub\').bin)")',
	},
	'targets': [
		{
			'target_name': 'webgl',
			'defines': [ 'VERSION=0.5.5' ],
			'sources': [
				'src/bindings.cpp',
				'src/image.cpp',
				'src/webgl.cpp',
			],
			'include_dirs': [
				'<!(node -e "require(\'nan\')")',
				'<(opengl_include)',
				'<!(node -e "require(\'node-addon-tools-raub\')")',
			],
			'library_dirs': [ '<(opengl_bin)' ],
			'conditions': [
				[
					'OS=="linux"',
					{
						'libraries': [
							'-Wl,-rpath,<(opengl_bin)',
							'<(opengl_bin)/libfreeimage.so',
							'<(opengl_bin)/libglfw.so.3',
							'<(opengl_bin)/libGLEW.so.2.0',
							'<(opengl_bin)/libGL.so',
							'<(opengl_bin)/libXrandr.so',
						],
					}
				],
				[
					'OS=="mac"',
					{
						'libraries': ['-lGLEW','-lfreeimage','-framework OpenGL'],
						'include_dirs': ['/usr/local/include'],
						'library_dirs': ['/usr/local/lib'],
					}
				],
				[
					'OS=="win"',
					{
						'libraries': [ 'FreeImage.lib', 'glfw3dll.lib', 'glew32.lib', 'opengl32.lib' ],
						'defines' : [
							'WIN32_LEAN_AND_MEAN',
							'VC_EXTRALEAN'
						],
						'msvs_version'  : '2013',
						'msvs_settings' : {
							'VCCLCompilerTool' : {
								'AdditionalOptions' : [
									'/O2','/Oy','/GL','/GF','/Gm-','/EHsc',
									'/MT','/GS','/Gy','/GR-','/Gd',
								]
							},
							'VCLinkerTool' : {
								'AdditionalOptions' : ['/OPT:REF','/OPT:ICF','/LTCG']
							},
						},
					}
				],
			],
		},
		
		{
			'target_name'  : 'make_directory',
			'type'         : 'none',
			'dependencies' : ['webgl'],
			'actions'      : [{
				'action_name' : 'Directory created.',
				'inputs'      : [],
				'outputs'     : ['build'],
				'conditions'  : [
					[ 'OS=="linux"', { 'action': ['mkdir', '-p', 'binary'] } ],
					[ 'OS=="mac"', { 'action': ['mkdir', '-p', 'binary'] } ],
					[ 'OS=="win"', { 'action': ['mkdir', 'binary'] } ],
				],
			}],
		},
		
		{
			'target_name'  : 'copy_binary',
			'type'         : 'none',
			'dependencies' : ['make_directory'],
			'actions'      : [{
				'action_name' : 'Module copied.',
				'inputs'      : [],
				'outputs'     : ['binary'],
				'conditions'  : [
					[ 'OS=="linux"', { 'action' : [
						'cp',
						'<(module_root_dir)/build/Release/webgl.node',
						'<(module_root_dir)/binary/webgl.node'
					] } ],
					[ 'OS=="mac"', { 'action' : [
						'cp',
						'<(module_root_dir)/build/Release/webgl.node',
						'<(module_root_dir)/binary/webgl.node'
					] } ],
					[ 'OS=="win"', { 'action' : [
						'copy "<(module_root_dir)/build/Release/webgl.node"' +
						' "<(module_root_dir)/binary"'
					] } ],
				],
			}],
		},
		
		{
			'target_name'  : 'remove_extras',
			'type'         : 'none',
			'dependencies' : ['copy_binary'],
			'actions'      : [{
				'action_name' : 'Build intermediates removed.',
				'inputs'      : [],
				'outputs'     : ['build'],
				'conditions'  : [
					[ 'OS=="linux"', { 'action' : [
						'rm',
						'<(module_root_dir)/build/Release/obj.target/webgl/src/webgl.o',
						'<(module_root_dir)/build/Release/obj.target/webgl.node',
						'<(module_root_dir)/build/Release/webgl.node'
					] } ],
					[ 'OS=="mac"'  , { 'action' : [ 'rm -rf <@(_inputs)' ] } ],
					[ 'OS=="win"'  , { 'action' : [
						'<(module_root_dir)/_del "<(module_root_dir)/build/Release/webgl.*" && ' +
						'<(module_root_dir)/_del "<(module_root_dir)/build/Release/obj/webgl/*.*'
					] } ],
				],
			}],
		},
		
	]
}
