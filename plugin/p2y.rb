#!/usr/local/bin/ruby
# encoding: UTF-8
require 'yaml'
require "base64"
require 'rexml/document'
require 'open3'

class PList < BasicObject
  ELEMENT_PROCESSORS = {}
  def self.process_element_named(name, &block); ELEMENT_PROCESSORS[name.to_s] = block;  end
  def self.process_element(elt)               ; ELEMENT_PROCESSORS[elt.name][elt];      end

  process_element_named(:plist  ) { |elt| process_element(elt.elements.first)                             }
  process_element_named(:true   ) { |elt| true                                                            }
  process_element_named(:false  ) { |elt| false                                                           }
  process_element_named(:string ) { |elt| elt.text                                                        }
  process_element_named(:integer) { |elt| elt.text.to_i                                                   }
  process_element_named(:real   ) { |elt| elt.text.to_f                                                   }
  process_element_named(:date   ) { |elt| ::Date.parse(elt.text)                                          }
  process_element_named(:data   ) { |elt| ::Base64.decode64(elt.text)                                     }
  process_element_named(:array  ) { |elt| elt.elements.to_a.inject([]) { |l, e| l << process_element(e) } }
  process_element_named(:dict   ) { |elt| elt.elements.partition { |e| e.name == 'key' }
                                            .inject     { |keys, values| keys.zip(values) }
                                            .inject({}) { |h, (k, v)| h[k.text] = process_element(v); h } }

  def self.new_from_path(file_path, sanitize = false)
    new(open(file_path), sanitize)
  end

  def self.pipe(cmd, input, allow_broken_pipe = false)
    ::Open3.popen3(cmd) { |i, o, *| i.write(input) rescue ::Errno::EPIPE raise unless allow_broken_pipe; i.close; o.read }
  end

  def initialize(io_or_string, sanitize = false)
    s            = io_or_string.is_a?(::IO) ? io_or_string.read : io_or_string.to_s
    sanitize   ||= ::PList.pipe('file -', s, :allow_broken_pipe) !~ /\b\XMLb/
    s            = ::PList.pipe('plutil -convert xml1 -o - -', s) if sanitize
    @root_object = ::PList.process_element(::REXML::Document.new(s).root)
  end

  def method_missing(*args, &block)
    @root_object.send(*args, &block)
  end
end

class PrettyYAML
  RX_QUOTED_STRING   = /(?<!\\)".*?(?<!\\)"/
  RX_YAML_HASH_BLOCK = /^( *)\S.*?:.*\n(\1\S.*?:.*\n)+/
  RX_KV_PAIR_LINE    = /^(.*?):(.*\n)/

  def self.[](yaml_string)
    new(yaml_string).to_s
  end
  
  def initialize(yaml_string)
    @yaml_string = yaml_string
    unescape_utf8_strings!
    align_colons!
  end
  
  def unescape_utf8_strings!
    @yaml_string.gsub!(RX_QUOTED_STRING) { |m| (s = eval(m).force_encoding(__ENCODING__)).valid_encoding? ? s.inspect : m }
  end

  def align_colons!
    @yaml_string.gsub!(RX_YAML_HASH_BLOCK) do |m|
      max = m.lines.map { |line| line.index(":") }.max 
      m.lines.map { |line| line.gsub(RX_KV_PAIR_LINE) { "%-#{max}s :%s" % [$1, $2] } }.join
    end
  end

  def to_s
    @yaml_string
  end
end

if $0 == __FILE__
  if ARGV.length
    begin
      ARGV.each { |path| puts PrettyYAML[PList.new_from_path(path).to_yaml] }
    rescue
      puts "parse %s file errro!" % ARGV[0]
      puts "check the file is a standard plist, please"
    end
  else
    puts "usage: p2y file\n      unlink file"
  end
end
